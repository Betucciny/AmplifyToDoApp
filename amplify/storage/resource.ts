import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'todoBucket',
  access: (allow) => ({
    'public/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  })
});