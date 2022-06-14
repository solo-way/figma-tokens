import React from 'react';
import { Selector } from 'reselect';

import { TokenTypes } from '@/constants/TokenTypes';
import { SingleToken } from '@/types/tokens';

import {
  activeTokenSetSelector,
  settingsStateSelector,
  tokensSelector,
  usedTokenSetSelector,
} from '@/selectors';

import { render } from '../../../../tests/config/setupTest';
import { TokenTooltipContent } from './TokenTooltipContent';

const resolvedTokens: SingleToken[] = [
  {
    name: 'color.foo',
    type: TokenTypes.COLOR,
    value: '#00ff00',
  },
  {
    name: 'testToken',
    type: TokenTypes.COLOR,
    value: '{color.foo}',
    rawValue: '#00ff00',
  },
];

const mockSelector = (selector: Selector) => {
  switch (selector) {
    case activeTokenSetSelector:
      return 'global';
    case usedTokenSetSelector:
      return {
        semantic: 'enabled',
        core: 'enabled',
        button: 'enabled',
        'icon-button': 'enabled',
        link: 'enabled',
        'text-field': 'enabled',
        radio: 'enabled',
        checkbox: 'enabled',
        switch: 'disabled',
        'field-label': 'disabled',
        'help-text': 'disabled',
        heading: 'disabled',
        body: 'disabled',
        detail: 'disabled',
        code: 'disabled',
        avatar: 'disabled',
        tag: 'disabled',
        'alert-banner': 'source',
        divider: 'source',
        'menu-item': 'source',
      };
    case tokensSelector:
      return {
        global: [
          {
            name: 'size.6',
            type: TokenTypes.SIZING,
            value: '2',
            rawValue: '2',
          },
          {
            name: 'size.alias',
            type: TokenTypes.SIZING,
            value: '2',
            rawValue: '{size.6}',
          },
          {
            name: 'color.slate.50',
            type: TokenTypes.COLOR,
            value: '#f8fafc',
            rawValue: '#f8fafc',
          },
          {
            name: 'color.alias',
            type: TokenTypes.COLOR,
            value: '#f8fafc',
            rawValue: '{color.slate.50}',
          },
          {
            name: 'border-radius.0',
            type: TokenTypes.BORDER_RADIUS,
            value: '64px',
            rawValue: '64px',
          },
        ],
        core: [
          {
            name: 'border-radius.alias',
            type: TokenTypes.BORDER_RADIUS,
            value: '64px',
            rawValue: '{border-radius.0}',
          },
          {
            name: 'opacity.10',
            type: TokenTypes.OPACITY,
            value: '10%',
            rawValue: '10%',
          },
        ],
        semantic: [
          {
            value: '{semantic.sizing.feedback.width}',
            type: 'sizing',
            name: 'alert-banner.width',
          },
        ],
      };
    case settingsStateSelector:
      return {
        uiWindow: {
          width: 400,
          height: 600,
          isMinimized: false,
        },
        updateMode: 'page',
        updateRemote: true,
        updateOnChange: true,
        updateStyles: true,
        tokenType: 'object',
        ignoreFirstPartForStyles: false,
        inspectDeep: false,
      };
    default:
      break;
  }
  return {};
};
const mockStore = jest.fn().mockImplementation(() => ({}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn().mockImplementation(() => ({
  })),
  useSelector: (selector: Selector) => mockSelector(selector),
  // useStore: () => mockStore(),
}));

const mockContextValues = { resolvedTokens };
jest
  .spyOn(React, 'useContext')
  .mockImplementation(() => mockContextValues);

describe('tokenTooltipContent test', () => {
  it('if token contains no alias', () => {
    const input: SingleToken = {
      name: 'testToken',
      type: TokenTypes.COLOR,
      value: '#00ff00',
    };
    const { getByText } = render(<TokenTooltipContent token={input} />);
    expect(getByText(input.value)).toBeInTheDocument();
  });

  it('if token contains alias', () => {
    const input: SingleToken = {
      name: 'testToken',
      type: TokenTypes.COLOR,
      value: '{color.foo}',
      rawValue: '#00ff00',
    };
    const { getByText } = render(<TokenTooltipContent token={input} />);
    expect(getByText(input.rawValue)).toBeInTheDocument();
  });
});
