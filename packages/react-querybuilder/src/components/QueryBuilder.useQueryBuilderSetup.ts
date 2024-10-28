import { useCallback, useMemo, useState } from 'react';
import { defaultCombinators, defaultOperators } from '../defaults';
import type { UseMergedContextReturn } from '../hooks/useMergedContext';
import { useMergedContext } from '../hooks/useMergedContext';
import type {
  BaseOption,
  FlexibleOptionGroup,
  FlexibleOptionList,
  FullCombinator,
  FullField,
  FullOperator,
  FullOption,
  FullOptionList,
  FullOptionMap,
  FullOptionRecord,
  GetOptionIdentifierType,
  GetRuleTypeFromGroupWithFieldAndOperator,
  Option,
  OptionGroup,
  QueryBuilderProps,
  RemoveNullability,
  RuleGroupTypeAny,
  RuleType,
  WithUnknownIndex,
} from '../types';
import {
  filterFieldsByComparator,
  generateID,
  getFirstOption,
  getValueSourcesUtil,
  isFlexibleOptionGroupArray,
  joinWith,
  objectKeys,
  toFullOption,
  toFullOptionList,
  toFullOptionMap,
  uniqByIdentifier,
  uniqOptGroups,
  uniqOptList,
} from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFirstOptionsFrom = (opts: any[], r: RuleType, listsAsArrays?: boolean) => {
  const firstOption = getFirstOption(opts);

  if (r.operator === 'between' || r.operator === 'notBetween') {
    const valueAsArray = [firstOption, firstOption];
    return listsAsArrays
      ? valueAsArray
      : joinWith(
          valueAsArray.map(v => v ?? /* istanbul ignore next */ ''),
          ','
        );
  }

  return firstOption;
};

export type UseQueryBuilderSetup<
  RG extends RuleGroupTypeAny,
  F extends FullField,
  O extends FullOperator,
  C extends FullCombinator,
> = {
  qbId: string;
  rqbContext: UseMergedContextReturn<F, GetOptionIdentifierType<O>>;
  fields: FullOptionList<F>;
  fieldMap: FullOptionMap<
    FullField<string, string, string, Option<string>, Option<string>>,
    GetOptionIdentifierType<F>
  >;
  combinators:
    | WithUnknownIndex<BaseOption<string> & FullOption<string>>[]
    | OptionGroup<WithUnknownIndex<BaseOption<string> & FullOption<string>>>[];
  getRuleDefaultValue: <RT extends RuleType = GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>>(
    r: RT
  ) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  createRule: () => GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>;
  createRuleGroup: (independentCombinators?: boolean) => RG;
} & RemoveNullability<{
  getInputTypeMain: QueryBuilderProps<RG, F, O, C>['getInputType'];
  getRuleDefaultOperator: QueryBuilderProps<RG, F, O, C>['getDefaultOperator'];
  getValueEditorTypeMain: QueryBuilderProps<RG, F, O, C>['getValueEditorType'];
  getValueSourcesMain: QueryBuilderProps<RG, F, O, C>['getValueSources'];
}> & {
    getOperatorsMain: (
      ...p: Parameters<NonNullable<QueryBuilderProps<RG, F, O, C>['getOperators']>>
    ) => FullOptionList<O>;
    getValuesMain: (
      ...p: Parameters<NonNullable<QueryBuilderProps<RG, F, O, C>['getValues']>>
    ) => FullOptionList<Option>;
  };

/**
 * Massages the props as necessary and prepares the basic update/generate methods
 * for use by the {@link QueryBuilder} component.
 */
export const useQueryBuilderSetup = <
  RG extends RuleGroupTypeAny,
  F extends FullField,
  O extends FullOperator,
  C extends FullCombinator,
>(
  props: QueryBuilderProps<RG, F, O, C>
): UseQueryBuilderSetup<RG, F, O, C> => {
  type R = GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>;
  type FieldName = GetOptionIdentifierType<F>;
  type OperatorName = GetOptionIdentifierType<O>;

  const [qbId] = useState(generateID);

  const {
    fields: fieldsPropOriginal,
    baseField,
    operators: operatorsProp,
    baseOperator,
    combinators: combinatorsProp = defaultCombinators,
    baseCombinator,
    translations: translationsProp,
    enableMountQueryChange: enableMountQueryChangeProp = true,
    controlClassnames: controlClassnamesProp,
    controlElements: controlElementsProp,
    getDefaultField,
    getDefaultOperator,
    getDefaultValue,
    getOperators,
    getValueEditorType,
    getValueSources,
    getInputType,
    getValues,
    autoSelectField = true,
    autoSelectOperator = true,
    addRuleToNewGroups = false,
    enableDragAndDrop: enableDragAndDropProp,
    listsAsArrays = false,
    debugMode: debugModeProp = false,
    idGenerator = generateID,
  } = props;

  const operators = (operatorsProp ?? defaultOperators) as FlexibleOptionList<O>;

  const [initialQueryProp] = useState(props.query ?? props.defaultQuery);

  const rqbContext = useMergedContext({
    controlClassnames: controlClassnamesProp,
    controlElements: controlElementsProp,
    debugMode: debugModeProp,
    enableDragAndDrop: enableDragAndDropProp,
    enableMountQueryChange: enableMountQueryChangeProp,
    translations: translationsProp,
    initialQuery: initialQueryProp,
    qbId: qbId,
    finalize: true,
  });

  const { translations } = rqbContext;

  // #region Set up `fields`
  const defaultField = useMemo(
    () =>
      ({
        id: translations.fields.placeholderName,
        name: translations.fields.placeholderName,
        value: translations.fields.placeholderName,
        label: translations.fields.placeholderLabel,
      }) as FullField,
    [translations.fields.placeholderLabel, translations.fields.placeholderName]
  );
  const fieldsProp = useMemo(
    () => fieldsPropOriginal ?? ([defaultField] as FlexibleOptionList<F>),
    [defaultField, fieldsPropOriginal]
  );

  const fields = useMemo((): FullOptionList<F> => {
    const flds = (
      Array.isArray(fieldsProp)
        ? toFullOptionList(fieldsProp, baseField)
        : (objectKeys(toFullOptionMap(fieldsProp, baseField)) as unknown as FieldName[])
            .map(fld => ({ ...fieldsProp[fld], name: fld, value: fld }))
            .sort((a, b) => a.label.localeCompare(b.label))
    ) as FullOptionList<F>;
    if (isFlexibleOptionGroupArray(flds)) {
      return autoSelectField
        ? (uniqOptGroups(flds) as FullOptionList<F>)
        : (uniqOptGroups([
            {
              label: translations.fields.placeholderGroupLabel,
              options: [defaultField],
            },
            ...flds,
          ]) as FullOptionList<F>);
    } else {
      return autoSelectField
        ? (uniqByIdentifier(flds as F[]) as FullOptionList<F>)
        : (uniqByIdentifier([defaultField, ...(flds as F[])]) as FullOptionList<F>);
    }
  }, [
    autoSelectField,
    baseField,
    defaultField,
    fieldsProp,
    translations.fields.placeholderGroupLabel,
  ]);

  const fieldMap = useMemo(() => {
    if (!Array.isArray(fieldsProp)) {
      const fp = toFullOptionMap(fieldsProp, baseField) as FullOptionMap<FullField, FieldName>;
      return autoSelectField ? fp : { ...fp, [translations.fields.placeholderName]: defaultField };
    }
    const fm: Partial<FullOptionRecord<FullField>> = {};
    if (isFlexibleOptionGroupArray(fields)) {
      // TODO: this `as` cast shouldn't be necessary with the type guard above
      for (const f of fields as FlexibleOptionGroup[]) {
        for (const opt of f.options) {
          fm[(opt.value ?? /* istanbul ignore next */ opt.name) as FieldName] = toFullOption(
            opt,
            baseField
          ) as FullField;
        }
      }
    } else {
      // TODO: this `as` cast shouldn't be necessary with the type guard above
      for (const f of fields as FullField[]) {
        fm[(f.value ?? /* istanbul ignore next */ f.name) as FieldName] = toFullOption(
          f,
          baseField
        ) as FullField;
      }
    }
    return fm;
  }, [
    autoSelectField,
    baseField,
    defaultField,
    fields,
    fieldsProp,
    translations.fields.placeholderName,
  ]);
  // #endregion

  const combinators = useMemo(
    () => toFullOptionList(combinatorsProp, baseCombinator),
    [baseCombinator, combinatorsProp]
  );

  // #region Set up `operators`
  const defaultOperator = useMemo(
    (): FullOption<OperatorName> => ({
      id: translations.operators.placeholderName,
      name: translations.operators.placeholderName as OperatorName,
      value: translations.operators.placeholderName as OperatorName,
      label: translations.operators.placeholderLabel,
    }),
    [translations.operators.placeholderLabel, translations.operators.placeholderName]
  );

  const getOperatorsMain = useCallback(
    (field: FieldName, { fieldData }: { fieldData: F }): FullOptionList<O> => {
      let opsFinal = toFullOptionList(operators as FlexibleOptionList<O>, baseOperator);

      if (fieldData?.operators) {
        opsFinal = toFullOptionList(fieldData.operators, baseOperator);
      } else if (getOperators) {
        const ops = getOperators(field, { fieldData }) as null | FlexibleOptionList<O>;
        if (ops) {
          opsFinal = toFullOptionList(ops, baseOperator);
        }
      }

      if (!autoSelectOperator) {
        opsFinal = isFlexibleOptionGroupArray(opsFinal)
          ? [
              {
                label: translations.operators.placeholderGroupLabel,
                options: [defaultOperator],
              },
              ...opsFinal,
            ]
          : [defaultOperator, ...opsFinal];
      }

      return uniqOptList(opsFinal) as FullOptionList<O>;
    },
    [
      autoSelectOperator,
      baseOperator,
      defaultOperator,
      getOperators,
      operators,
      translations.operators.placeholderGroupLabel,
    ]
  );

  const getRuleDefaultOperator = useCallback(
    (field: FieldName): OperatorName => {
      const fieldData = fieldMap[field] as F;

      if (fieldData?.defaultOperator) {
        return fieldData.defaultOperator as OperatorName;
      }

      if (getDefaultOperator) {
        return typeof getDefaultOperator === 'function'
          ? (getDefaultOperator(field, { fieldData }) as OperatorName)
          : getDefaultOperator;
      }

      const ops = getOperatorsMain(field, { fieldData }) ?? /* istanbul ignore next */ [];
      return (getFirstOption(ops) ?? /* istanbul ignore next */ '') as OperatorName;
    },
    [fieldMap, getDefaultOperator, getOperatorsMain]
  );
  // #endregion

  // #region Rule property getters
  const getValueEditorTypeMain = useCallback(
    (field: FieldName, operator: OperatorName, { fieldData }: { fieldData: F }) => {
      if (fieldData.valueEditorType) {
        if (typeof fieldData.valueEditorType === 'function') {
          return fieldData.valueEditorType(operator);
        }
        return fieldData.valueEditorType;
      }

      return getValueEditorType?.(field, operator, { fieldData }) ?? 'text';
    },
    [getValueEditorType]
  );

  const getValueSourcesMain = useCallback(
    (field: FieldName, operator: OperatorName) =>
      getValueSourcesUtil<F, OperatorName>(fieldMap[field] as F, operator, getValueSources),
    [fieldMap, getValueSources]
  );

  const getValuesMain = useCallback(
    (field: FieldName, operator: OperatorName, { fieldData }: { fieldData: F }) => {
      // Ignore this in tests because Rule already checks for
      // the presence of the values property in fieldData.
      /* istanbul ignore if */
      if (fieldData?.values) {
        return toFullOptionList(fieldData.values);
      }
      if (getValues) {
        return toFullOptionList(getValues(field, operator, { fieldData }));
      }

      return [];
    },
    [getValues]
  );

  const getRuleDefaultValue = useCallback(
    <RT extends RuleType = R>(r: RT) => {
      const fieldData = (fieldMap[r.field as FieldName] ?? {}) as F;
      if (fieldData?.defaultValue !== undefined && fieldData.defaultValue !== null) {
        return fieldData.defaultValue;
      } else if (getDefaultValue) {
        return getDefaultValue(r, { fieldData });
      }

      let value: string | (string | null)[] | boolean | null = '';

      const values = getValuesMain(r.field as FieldName, r.operator as OperatorName, {
        fieldData,
      });

      if (r.valueSource === 'field') {
        const filteredFields = filterFieldsByComparator(fieldData, fields, r.operator);
        value =
          filteredFields.length > 0 ? getFirstOptionsFrom(filteredFields, r, listsAsArrays) : '';
      } else if (values.length > 0) {
        const editorType = getValueEditorTypeMain(
          r.field as FieldName,
          r.operator as OperatorName,
          { fieldData }
        );
        if (editorType === 'multiselect') {
          value = listsAsArrays ? [] : '';
        } else if (editorType === 'select' || editorType === 'radio') {
          value = getFirstOptionsFrom(values, r, listsAsArrays);
        }
      } else {
        const editorType = getValueEditorTypeMain(
          r.field as FieldName,
          r.operator as OperatorName,
          { fieldData }
        );
        if (editorType === 'checkbox') {
          value = false;
        }
      }

      return value;
    },
    [fieldMap, fields, getDefaultValue, getValueEditorTypeMain, getValuesMain, listsAsArrays]
  );

  const getInputTypeMain = useCallback(
    (field: FieldName, operator: OperatorName, { fieldData }: { fieldData: F }) => {
      if (getInputType) {
        const inputType = getInputType(field, operator, { fieldData });
        if (inputType) return inputType;
      }

      return 'text';
    },
    [getInputType]
  );
  // #endregion

  // #region Rule/group creators
  const createRule = useCallback((): R => {
    let field = '' as FieldName;
    const flds = fields as FullOptionList<F>;
    /* istanbul ignore else */
    if (flds?.length > 0 && flds[0]) {
      const fo = getFirstOption(flds) as FieldName;
      /* istanbul ignore else */
      if (fo) field = fo;
    }
    if (getDefaultField) {
      if (typeof getDefaultField === 'function') {
        const df = getDefaultField(flds) as FieldName;
        /* istanbul ignore else */
        if (df) field = df;
      } else {
        field = getDefaultField;
      }
    }

    const operator = getRuleDefaultOperator(field);

    const valueSource = getValueSourcesMain(field, operator)[0] ?? 'value';

    const newRule = {
      id: idGenerator(),
      field,
      operator,
      valueSource,
      value: '',
    } as unknown as R;

    const value = getRuleDefaultValue(newRule);

    return { ...newRule, value };
  }, [
    fields,
    getDefaultField,
    getRuleDefaultOperator,
    getRuleDefaultValue,
    getValueSourcesMain,
    idGenerator,
  ]);

  const createRuleGroup = useCallback(
    (independentCombinators?: boolean): RG => {
      if (independentCombinators) {
        return {
          id: idGenerator(),
          rules: addRuleToNewGroups ? [createRule() as RuleType] : [],
          not: false,
        } as RG;
      }
      // TODO: Avoid `@ts-expect-error`
      // @ts-expect-error TS can't tell that RG is necessarily RuleGroupType
      return {
        id: idGenerator(),
        rules: addRuleToNewGroups ? [createRule()] : [],
        combinator: getFirstOption(combinators) ?? /* istanbul ignore next */ '',
        not: false,
      };
    },
    [addRuleToNewGroups, combinators, createRule, idGenerator]
  );
  // #endregion

  return {
    qbId,
    rqbContext,
    fields,
    fieldMap,
    combinators,
    getOperatorsMain,
    getRuleDefaultOperator,
    getValueEditorTypeMain,
    getValueSourcesMain,
    getValuesMain,
    getRuleDefaultValue,
    getInputTypeMain,
    createRule,
    createRuleGroup,
  };
};