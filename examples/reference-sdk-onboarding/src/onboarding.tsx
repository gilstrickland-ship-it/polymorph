import { useState } from "react";
import {
  Screen,
  Stack,
  Card,
  ThemedText,
  Field,
  PrimaryButton,
  StepIndicator,
} from "@polymorph/adapter-react-native";

const STEP_COUNT = 3;
const isEmail = (v: string): boolean => /.+@.+\..+/.test(v);

export interface OnboardingProps {
  onComplete?: (data: { name: string; email: string }) => void;
}

/**
 * Reference "account opening" wizard. Coded ONLY against the Polymorph contract via the React
 * Native adapter's themed components — no host primitives, no hard-coded colors/sizes, no
 * bank-specific imports. Dropping it into any conformant theme re-skins it with zero edits here.
 */
export function Onboarding({ onComplete }: OnboardingProps): JSX.Element {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const nameError = touched && name.trim().length === 0 ? "Please enter your name" : undefined;
  const emailError = touched && !isEmail(email) ? "Enter a valid email address" : undefined;

  return (
    <Screen>
      <Stack gap="pm.space.lg">
        <StepIndicator count={STEP_COUNT} active={step} />

        {step === 0 && (
          <Stack gap="pm.space.md">
            <ThemedText variant="heading">Open your account</ThemedText>
            <ThemedText variant="body">
              A few quick steps to get started. Your information is encrypted in transit.
            </ThemedText>
            <PrimaryButton label="Get started" onPress={() => setStep(1)} />
          </Stack>
        )}

        {step === 1 && (
          <Card>
            <Stack gap="pm.space.md">
              <ThemedText variant="heading">Your details</ThemedText>
              <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" error={nameError} />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="jane@example.com"
                error={emailError}
              />
              <PrimaryButton
                label="Continue"
                onPress={() => {
                  if (name.trim() && isEmail(email)) {
                    setTouched(false);
                    setStep(2);
                  } else {
                    setTouched(true);
                  }
                }}
              />
            </Stack>
          </Card>
        )}

        {step === 2 && (
          <Stack gap="pm.space.md">
            <ThemedText variant="heading">Review &amp; confirm</ThemedText>
            <ThemedText variant="body">Opening an account for {name} ({email}).</ThemedText>
            <ThemedText variant="caption">
              By continuing you agree to the deposit account terms and electronic disclosures.
            </ThemedText>
            <PrimaryButton label="Open account" onPress={() => onComplete?.({ name, email })} />
          </Stack>
        )}
      </Stack>
    </Screen>
  );
}
