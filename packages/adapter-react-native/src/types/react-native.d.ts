// Minimal ambient subset of the React Native API the adapter primitives use, so the package
// typechecks/builds WITHOUT installing react-native (which stays a peerDependency). Consumers
// provide the real react-native; these declarations are not emitted to dist.
declare module "react-native" {
  import type * as React from "react";

  export interface ViewStyle {
    [key: string]: unknown;
  }
  export interface TextStyle {
    [key: string]: unknown;
  }

  export interface ViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export interface TextProps {
    style?: TextStyle | TextStyle[];
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export interface PressableProps {
    style?: ViewStyle | ViewStyle[];
    onPress?: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export interface TextInputProps {
    style?: (TextStyle | ViewStyle) | (TextStyle | ViewStyle)[];
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    editable?: boolean;
    [key: string]: unknown;
  }

  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const Pressable: React.ComponentType<PressableProps>;
  export const TextInput: React.ComponentType<TextInputProps>;

  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle>>(styles: T): T;
    flatten(style: unknown): ViewStyle & TextStyle;
  };
}
