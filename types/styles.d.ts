declare module "*.sass" {
  import { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
  const content: {
    [className: string]: StyleProp<ViewStyle | TextStyle | ImageStyle>;
  };
  export default content;
}
declare module "*.scss" {
  import { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
  const content: {
    [className: string]: StyleProp<ViewStyle | TextStyle | ImageStyle>;
  };
  export default content;
}
declare module "*.css" {
  import { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";

  const content: {
    [className: string]: StyleProp<ViewStyle | TextStyle | ImageStyle>;
  };
  export default content;
}
