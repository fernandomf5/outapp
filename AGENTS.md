
- Conditional text inside JSX ternaries can be overwritten in the dev preview by the Lovable preview instrumentation (DOM shows the else literal while React state is correct). Verify conditional text via React fiber props or the production build, not the preview DOM.
- Financial month status updates must merge through `patchMonthlyStatus`; replacing a period entry can erase its amount, type, and category overrides.
