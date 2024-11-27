import { tags } from 'typia';

export type NotEmptyString = tags.TagBase<{
  kind: 'String Not Empty';
  target: 'string';
  validate: `$input.trim().length != 0`;
  value: undefined;
}>;
