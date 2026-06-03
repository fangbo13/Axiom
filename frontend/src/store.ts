import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/auth/authSlice'
import projectReducer from './features/projects/projectSlice'
import ledgerReducer from './features/ledger/ledgerSlice'
import importsReducer from './features/imports/importsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    ledger: ledgerReducer,
    imports: importsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setCredentials'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
