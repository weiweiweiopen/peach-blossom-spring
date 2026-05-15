const noopRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Placeholder rule for local lint compatibility',
    },
    schema: [],
    messages: {},
  },
  create() {
    return {};
  },
};

export default {
  rules: {
    'no-inline-colors': noopRule,
    'pixel-shadow': noopRule,
    'pixel-font': noopRule,
  },
};
