import type React from 'react';

export enum AppStep {
  UPLOAD = 1,
  STYLE_SELECTION = 2,
  RESULTS = 3,
}

export interface StyleOption {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  prompt: string;
  categoryKey: string;
}

export interface ManualSettings {
  background: string;
  lighting: string;
  props: string;
}

export interface GeneratedImage {
  src: string;
  prompt: string;
}

export interface GeneratedCaption {
  id: number;
  text: string;
}