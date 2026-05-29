import { ThemedText, PrimaryButton, Field, Card, Stack, StepIndicator } from "@polymorph/adapter-web";

/**
 * A small, deliberately self-contained component composition rendered inside the builder's
 * preview slot. Uses only @polymorph/adapter-web themed primitives so every visible value
 * resolves from the working theme — when the FI edits `pm.color.action.primary.rest`, the
 * `PrimaryButton` background shifts immediately.
 *
 * This is the "is the theme actually applied?" canary: the showcase doesn't ship its own
 * styles, so if a theme edit doesn't reflect in the preview, the wiring is wrong.
 */
export function Showcase(): JSX.Element {
  return (
    <Stack>
      <ThemedText variant="heading">Account opening</ThemedText>
      <Card>
        <Stack>
          <ThemedText variant="body">Tell us about you.</ThemedText>
          <Field label="Full name" placeholder="Jane Doe" />
          <Field label="Email" placeholder="jane@example.com" />
        </Stack>
      </Card>
      <StepIndicator count={3} active={1} />
      <PrimaryButton label="Continue" onPress={() => {}} />
    </Stack>
  );
}
