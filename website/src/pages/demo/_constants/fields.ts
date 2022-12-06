import type { Field, RuleType } from 'react-querybuilder';
import { defaultOperators } from 'react-querybuilder';
import { musicalInstruments } from './musicalInstruments';

export const validator = (r: RuleType) => !!r.value;

export const fields: Field[] = [
  {
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    validator,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter last name',
    defaultOperator: 'beginsWith',
    validator,
  },
  { name: 'age', label: 'Age', inputType: 'number', validator },
  {
    name: 'isMusician',
    label: 'Is a musician',
    valueEditorType: 'checkbox',
    operators: defaultOperators.filter(op => op.name === '='),
    defaultValue: false,
  },
  {
    name: 'instrument',
    label: 'Primary instrument',
    valueEditorType: 'select',
    values: musicalInstruments,
    defaultValue: 'Piano',
    operators: defaultOperators.filter(op => op.name === '=' || op.name === 'in'),
  },
  {
    name: 'alsoPlaysInstruments',
    label: 'Also plays instruments',
    valueEditorType: 'multiselect',
    values: musicalInstruments,
    defaultValue: 'Guitar',
    operators: defaultOperators.filter(op => op.name === 'in'),
  },
  {
    name: 'gender',
    label: 'Gender',
    operators: defaultOperators.filter(op => op.name === '='),
    valueEditorType: 'radio',
    values: [
      { name: 'M', label: 'Male' },
      { name: 'F', label: 'Female' },
      { name: 'O', label: 'Other' },
    ],
  },
  { name: 'height', label: 'Height', validator },
  { name: 'job', label: 'Job', validator },
  { name: 'description', label: 'Description', valueEditorType: 'textarea' },
  { name: 'birthdate', label: 'Birth Date', inputType: 'date' },
  { name: 'datetime', label: 'Show Time', inputType: 'datetime-local' },
  { name: 'alarm', label: 'Daily Alarm', inputType: 'time' },
  {
    name: 'groupedField1',
    label: 'Grouped Field 1',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField2',
    label: 'Grouped Field 2',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField3',
    label: 'Grouped Field 3',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField4',
    label: 'Grouped Field 4',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
];

export const fieldsTsString = `import type { Field, RuleType } from 'react-querybuilder';
import { defaultOperators } from 'react-querybuilder';
import { musicalInstruments } from './musicalInstruments';

const validator = (r: RuleType) => !!r.value;

export const fields: Field[] = [
  {
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    validator,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter last name',
    defaultOperator: 'beginsWith',
    validator,
  },
  { name: 'age', label: 'Age', inputType: 'number', validator },
  {
    name: 'isMusician',
    label: 'Is a musician',
    valueEditorType: 'checkbox',
    operators: defaultOperators.filter(op => op.name === '='),
    defaultValue: false,
  },
  {
    name: 'instrument',
    label: 'Primary instrument',
    valueEditorType: 'select',
    values: musicalInstruments,
    defaultValue: 'Piano',
    operators: defaultOperators.filter(op => op.name === '=' || op.name === 'in'),
  },
  {
    name: 'alsoPlaysInstruments',
    label: 'Also plays instruments',
    valueEditorType: 'multiselect',
    values: musicalInstruments,
    defaultValue: 'Guitar',
    operators: defaultOperators.filter(op => op.name === 'in'),
  },
  {
    name: 'gender',
    label: 'Gender',
    operators: defaultOperators.filter(op => op.name === '='),
    valueEditorType: 'radio',
    values: [
      { name: 'M', label: 'Male' },
      { name: 'F', label: 'Female' },
      { name: 'O', label: 'Other' },
    ],
  },
  { name: 'height', label: 'Height', validator },
  { name: 'job', label: 'Job', validator },
  { name: 'description', label: 'Description', valueEditorType: 'textarea' },
  { name: 'birthdate', label: 'Birth Date', inputType: 'date' },
  { name: 'datetime', label: 'Show Time', inputType: 'datetime-local' },
  { name: 'alarm', label: 'Daily Alarm', inputType: 'time' },
  {
    name: 'groupedField1',
    label: 'Grouped Field 1',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField2',
    label: 'Grouped Field 2',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField3',
    label: 'Grouped Field 3',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
  {
    name: 'groupedField4',
    label: 'Grouped Field 4',
    comparator: 'group',
    group: 'group1',
    valueSources: ['field', 'value'],
  },
];
`;
