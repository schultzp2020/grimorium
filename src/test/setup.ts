import '@testing-library/jest-dom/vitest'
// Ensure all role and effect definitions are registered in their registries
// before any tests run. The barrel imports trigger the registerRole/registerEffect calls.
import '../lib/roles/index'
import '../lib/effects/index'
