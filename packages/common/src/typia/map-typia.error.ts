import { IValidation } from 'typia';

import { logger } from '../get-logger';

interface Token {
  type: 'Identifier' | 'Operator' | 'Parameter' | 'LeftParen' | 'RightParen';
  value: string;
}

interface OperatorNode {
  kind: 'operator';
  operator: '&' | '|';
  left: ASTNode;
  right: ASTNode;
}

interface TypeNode {
  kind: 'type';
  typeName: string;
}

interface ParameterizedTypeNode {
  kind: 'parameterizedType';
  typeName: string;
  parameter: string;
}

type ASTNode = OperatorNode | TypeNode | ParameterizedTypeNode;

interface MessageResult {
  optional: boolean;
  description: string;
}

// Mapping Functions
const typeDescriptions: { [key: string]: string } = {
  string: 'a string',
  number: 'a number',
  boolean: 'a boolean',
  FilePath: 'a file path',
  null: 'null',
  array: 'an array',
  object: 'an object',
  bigint: 'a bigint',

  // Custom Types
  NotEmptyString: 'not an empty string',
  int32: 'a 32-bit integer',
  uint32: 'an unsigned 32-bit integer',
  int64: 'a 64-bit integer',
  uint64: 'an unsigned 64-bit integer',
  float: 'a float',
  double: 'a double',

  // String Formats
  byte: 'a byte string',
  password: 'a password',
  uuid: 'a UUID',
  email: 'an email address',
  hostname: 'a hostname',
  'idn-email': 'an internationalized email address',
  'idn-hostname': 'an internationalized hostname',
  iri: 'an IRI',
  'iri-reference': 'an IRI reference',
  ipv4: 'an IPv4 address',
  ipv6: 'an IPv6 address',
  uri: 'a URI',
  'uri-reference': 'a URI reference',
  'uri-template': 'a URI template',
  url: 'a URL',
  'date-time': 'a date-time string',
  date: 'a date string',
  time: 'a time string',
  duration: 'a duration string',
  'json-pointer': 'a JSON pointer',
  'relative-json-pointer': 'a relative JSON pointer',
  // Add more types as needed
};

const parameterizedTypeDescriptions: { [key: string]: string } = {
  // Type Tags for Number
  Type: 'be of type {param}',
  Minimum: 'have a minimum value of {param}',
  Maximum: 'have a maximum value of {param}',
  ExclusiveMaximum: 'have an exclusive maximum of {param}',
  ExclusiveMinimum: 'have an exclusive minimum of {param}',
  MultipleOf: 'be a multiple of {param}',

  // Type Tags for BigInt
  // Type is already handled above

  // Type Tags for String
  MinLength: 'have a minimum length of {param}',
  MaxLength: 'have a maximum length of {param}',
  Pattern: 'match the required pattern',
  Format: 'have a format of {param}',

  // Add more mappings as needed
};

function mapTypeToDescription(typeName: string): string {
  return typeDescriptions[typeName] || typeName;
}

function mapParameterizedTypeToDescription(typeName: string, parameter: string): string {
  const cleanedParam = parameter.replace(/^"|"$/g, ''); // Remove surrounding quotes
  const template = parameterizedTypeDescriptions[typeName];
  if (template) {
    // If the parameter is a type keyword, map it using typeDescriptions
    if (typeName === 'Type') {
      const mappedType = mapTypeToDescription(cleanedParam);
      return template.replace('{param}', mappedType);
    }
    return template.replace('{param}', cleanedParam);
  } else {
    return `${typeName}<${parameter}>`;
  }
}

// Tokenizer
function tokenize(expected: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expected.length) {
    const char = expected[i];
    if (/\s/.test(char)) {
      i++;
    } else if (char === '&' || char === '|') {
      tokens.push({ type: 'Operator', value: char });
      i++;
    } else if (char === '<') {
      i++;
      const start = i;
      while (i < expected.length && expected[i] !== '>') {
        i++;
      }
      if (i >= expected.length) {
        throw new Error("Unmatched '<'");
      }
      const parameter = expected.substring(start, i);
      tokens.push({ type: 'Parameter', value: parameter });
      i++; // Skip '>'
    } else if (char === '(') {
      tokens.push({ type: 'LeftParen', value: char });
      i++;
    } else if (char === ')') {
      tokens.push({ type: 'RightParen', value: char });
      i++;
    } else if (/[a-zA-Z_]/.test(char)) {
      const start = i;
      // eslint-disable-next-line no-useless-escape
      while (i < expected.length && /[a-zA-Z0-9_\-]/.test(expected[i])) {
        i++;
      }
      const identifier = expected.substring(start, i);
      tokens.push({ type: 'Identifier', value: identifier });
    } else {
      throw new Error(`Unexpected character '${char}' at position ${i}`);
    }
  }
  return tokens;
}

// Parser
function parseExpected(tokens: Token[]): ASTNode {
  let position = 0;

  function currentToken(): Token | undefined {
    return tokens[position];
  }

  function consumeToken(): Token {
    return tokens[position++];
  }

  function parseExpression(precedence = 0): ASTNode {
    let left = parseFactor();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const token = currentToken();
      if (!token || token.type !== 'Operator') {
        break;
      }

      const tokenPrecedence = getPrecedence(token.value);
      if (tokenPrecedence < precedence) {
        break;
      }

      consumeToken(); // Consume operator
      const right = parseExpression(tokenPrecedence + 1);
      left = {
        kind: 'operator',
        operator: token.value as '&' | '|',
        left: left,
        right: right,
      };
    }

    return left;
  }

  function parseFactor(): ASTNode {
    const token = currentToken();
    if (!token) {
      throw new Error(`Unexpected end of input`);
    }

    if (token.type === 'LeftParen') {
      consumeToken(); // Consume '('
      const expr = parseExpression();
      const nextToken = currentToken();
      if (!nextToken || nextToken.type !== 'RightParen') {
        throw new Error(`Expected ')' at position ${position}`);
      }
      consumeToken(); // Consume ')'
      return expr;
    }

    if (token.type === 'Identifier') {
      consumeToken(); // Consume identifier
      const typeName = token.value;
      const nextToken = currentToken();
      if (nextToken && nextToken.type === 'Parameter') {
        consumeToken(); // Consume parameter
        return {
          kind: 'parameterizedType',
          typeName: typeName,
          parameter: nextToken.value,
        };
      } else {
        return {
          kind: 'type',
          typeName: typeName,
        };
      }
    }

    throw new Error(`Unexpected token '${token.value}' at position ${position}`);
  }

  function getPrecedence(operator: string): number {
    switch (operator) {
      case '&':
        return 2;
      case '|':
        return 1;
      default:
        return 0;
    }
  }

  const ast = parseExpression();
  if (position < tokens.length) {
    throw new Error(`Unexpected token at position ${position}`);
  }
  return ast;
}

// Message Builder
function buildDescription(node: ASTNode): MessageResult {
  switch (node.kind) {
    case 'operator': {
      const leftResult = buildDescription(node.left);
      const rightResult = buildDescription(node.right);
      let optional = leftResult.optional || rightResult.optional;
      let description = '';

      if (node.operator === '|') {
        if (leftResult.description === 'null') {
          optional = true;
          description = rightResult.description;
        } else if (rightResult.description === 'null') {
          optional = true;
          description = leftResult.description;
        } else {
          description = `${leftResult.description} OR ${rightResult.description}`;
        }
      } else if (node.operator === '&') {
        description = `${leftResult.description} AND ${rightResult.description}`;
      }

      return {
        optional: optional,
        description: description,
      };
    }

    case 'type': {
      const typeName = node.typeName;
      if (typeName === 'null') {
        return {
          optional: true,
          description: 'null',
        };
      } else {
        const description = mapTypeToDescription(typeName);
        return {
          optional: false,
          description: description,
        };
      }
    }

    case 'parameterizedType': {
      const typeName = node.typeName;
      const parameter = node.parameter;
      const description = mapParameterizedTypeToDescription(typeName, parameter);
      return {
        optional: false,
        description: description,
      };
    }

    default: {
      // Ensures exhaustive checking
      const exhaustiveCheck: never = node;
      throw new Error(`Unhandled node kind: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

// Generate Error Message
function generateErrorMessage(expected: string, propertyName: string): string {
  try {
    const tokens = tokenize(expected);
    const ast = parseExpected(tokens);
    const result = buildDescription(ast);
    const verb = result.optional ? 'SHOULD' : 'MUST';
    const message = `${propertyName} ${verb} be ${result.description}`;
    return message;
  } catch (error: unknown) {
    // Log the error for debugging
    if (error instanceof Error) {
      logger.error(
        `Failed to parse expected string: "${expected}" for property "${propertyName}". Error: ${error.message}`,
      );
    } else {
      logger.error(`Failed to parse expected string: "${expected}" for property "${propertyName}". Error: ${error}`);
    }

    // Provide a generic fallback message
    return `${propertyName} has an invalid value.`;
  }
}

function cleanExpectedTypes(expected: string): string {
  // Remove "& Example<...>" or "| Example<...>"
  let cleaned = expected.replace(/(?:&|\|)\s*Example<[^>]+>/g, '');

  // Remove standalone "Example<...>"
  cleaned = cleaned.replace(/Example<[^>]+>/g, '');

  // Remove "& undefined" or "| undefined"
  cleaned = cleaned.replace(/(?:&|\|)\s*undefined/g, '');

  // Remove standalone "undefined"
  cleaned = cleaned.replace(/\bundefined\b/g, '');

  // Remove any dangling "&" or "|" that may have resulted from the removal
  cleaned = cleaned.replace(/(?:&|\|)\s*$/g, '').trim();

  // Replace multiple spaces with a single space
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

function extractPropertyName(path: string): string {
  let propertyPath = path.replace('$input', '');

  // Replace square bracket notation with dot notation
  propertyPath = propertyPath.replace(/\["([^"]+)"\]/g, '.$1');

  // Remove leading dots or brackets
  // eslint-disable-next-line no-useless-escape
  propertyPath = propertyPath.replace(/^[\.\[]+/, '');

  return propertyPath;
}

// Map Errors tggjko Messages
export function mapErrorsToMessages(errors: IValidation.IError[]): string[] {
  return errors.map((error) => {
    const propertyName = extractPropertyName(error.path);
    const cleanedExpected = cleanExpectedTypes(error.expected);
    return generateErrorMessage(cleanedExpected, propertyName);
  });
}
