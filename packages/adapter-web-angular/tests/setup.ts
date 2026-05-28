// Zone.js + Angular TestBed bootstrap. Vitest loads this once via vitest.config.setupFiles.
import "zone.js";
import "zone.js/testing";
import { TestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
