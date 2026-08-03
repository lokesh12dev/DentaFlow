const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'quality-reports/**', 'patient-portal/**', 'project-ui/**', 'supabase/functions/**'],
  },
]);
