// figma-extend.d.ts
import "@figma/plugin-typings";

declare global {
  interface ComponentSetNode {
    setPropertiesForVariantGroup(
      propertyName: string,
      config: { values: string[] }
    ): void;
  }
}
