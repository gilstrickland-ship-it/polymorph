// AUTO-GENERATED from manifest/ + schema/ — DO NOT EDIT.
// Run `pnpm --filter @polymorph/spec generate` to regenerate.

export const dtcgTypesSchema: Record<string, unknown> = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://polymorph.dev/schema/dtcg-types.schema.json",
  "title": "Polymorph accepted DTCG 2025.10 $type subset",
  "description": "Reusable token definitions. A token $value may be a concrete value or a DTCG alias reference '{group.path}'.",
  "$defs": {
    "alias": {
      "type": "string",
      "pattern": "^\\{[A-Za-z0-9_][A-Za-z0-9_.-]*\\}$"
    },
    "tokenMeta": {
      "$description": {
        "type": "string"
      },
      "$extensions": {
        "type": "object"
      }
    },
    "color": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "color"
        },
        "$value": {
          "type": "string"
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "dimension": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "dimension"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "number"
                },
                "unit": {
                  "enum": [
                    "px",
                    "rem"
                  ]
                }
              },
              "required": [
                "value",
                "unit"
              ],
              "additionalProperties": false
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "duration": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "duration"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "number"
                },
                "unit": {
                  "enum": [
                    "ms",
                    "s"
                  ]
                }
              },
              "required": [
                "value",
                "unit"
              ],
              "additionalProperties": false
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "number": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "number"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "type": "number"
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "cubicBezier": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "cubicBezier"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "type": "array",
              "items": {
                "type": "number"
              },
              "minItems": 4,
              "maxItems": 4
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "typography": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "typography"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "type": "object",
              "properties": {
                "fontFamily": {
                  "type": [
                    "string",
                    "array"
                  ]
                },
                "fontWeight": {
                  "type": [
                    "string",
                    "number"
                  ]
                },
                "fontSize": {
                  "oneOf": [
                    {
                      "$ref": "#/$defs/alias"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "value": {
                          "type": "number"
                        },
                        "unit": {
                          "enum": [
                            "px",
                            "rem"
                          ]
                        }
                      },
                      "required": [
                        "value",
                        "unit"
                      ],
                      "additionalProperties": false
                    }
                  ]
                },
                "lineHeight": {
                  "type": "number"
                },
                "letterSpacing": {
                  "oneOf": [
                    {
                      "$ref": "#/$defs/alias"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "value": {
                          "type": "number"
                        },
                        "unit": {
                          "enum": [
                            "px",
                            "rem",
                            "em"
                          ]
                        }
                      },
                      "required": [
                        "value",
                        "unit"
                      ],
                      "additionalProperties": false
                    }
                  ]
                }
              },
              "required": [
                "fontFamily",
                "fontWeight",
                "fontSize",
                "lineHeight",
                "letterSpacing"
              ],
              "additionalProperties": false
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "shadow": {
      "type": "object",
      "properties": {
        "$type": {
          "const": "shadow"
        },
        "$value": {
          "oneOf": [
            {
              "$ref": "#/$defs/alias"
            },
            {
              "$ref": "#/$defs/shadowValue"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/$defs/shadowValue"
              }
            }
          ]
        },
        "$description": {
          "type": "string"
        },
        "$extensions": {
          "type": "object"
        }
      },
      "required": [
        "$type",
        "$value"
      ],
      "additionalProperties": false
    },
    "shadowValue": {
      "type": "object",
      "properties": {
        "color": {
          "type": "string"
        },
        "offsetX": {
          "$ref": "#/$defs/lengthOrAlias"
        },
        "offsetY": {
          "$ref": "#/$defs/lengthOrAlias"
        },
        "blur": {
          "$ref": "#/$defs/lengthOrAlias"
        },
        "spread": {
          "$ref": "#/$defs/lengthOrAlias"
        },
        "inset": {
          "type": "boolean"
        }
      },
      "required": [
        "color",
        "offsetX",
        "offsetY",
        "blur",
        "spread"
      ],
      "additionalProperties": false
    },
    "lengthOrAlias": {
      "oneOf": [
        {
          "$ref": "#/$defs/alias"
        },
        {
          "type": "object",
          "properties": {
            "value": {
              "type": "number"
            },
            "unit": {
              "enum": [
                "px",
                "rem"
              ]
            }
          },
          "required": [
            "value",
            "unit"
          ],
          "additionalProperties": false
        }
      ]
    }
  }
};

export const componentsSchema: Record<string, unknown> = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://polymorph.dev/schema/components.schema.json",
  "title": "Polymorph optional component-token overrides (closed v0 role set)",
  "$defs": {
    "button": {
      "type": "object",
      "properties": {
        "primary": {
          "type": "object",
          "properties": {
            "background": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            },
            "foreground": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            },
            "radius": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            }
          },
          "required": [],
          "additionalProperties": false
        },
        "secondary": {
          "type": "object",
          "properties": {
            "background": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            },
            "border": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            },
            "foreground": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            }
          },
          "required": [],
          "additionalProperties": false
        },
        "danger": {
          "type": "object",
          "properties": {
            "background": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            },
            "foreground": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
            }
          },
          "required": [],
          "additionalProperties": false
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "input": {
      "type": "object",
      "properties": {
        "background": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "border": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "borderFocus": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "foreground": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "radius": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "card": {
      "type": "object",
      "properties": {
        "background": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "radius": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
        },
        "elevation": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "stepIndicator": {
      "type": "object",
      "properties": {
        "activeColor": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "inactiveColor": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "disclosure": {
      "type": "object",
      "properties": {
        "foreground": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
        },
        "typography": {
          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
        }
      },
      "required": [],
      "additionalProperties": false
    }
  }
};

export const themeSchema: Record<string, unknown> = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://polymorph.dev/schema/theme.schema.json",
  "title": "Polymorph theme file",
  "type": "object",
  "required": [
    "pm"
  ],
  "properties": {
    "$schema": {
      "type": "string"
    },
    "contractVersion": {
      "type": "string"
    },
    "pm": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "border",
        "modes",
        "motion",
        "opacity",
        "radius",
        "size",
        "space",
        "typography"
      ],
      "properties": {
        "typography": {
          "type": "object",
          "properties": {
            "display": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "heading": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "headingSm": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "body": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "bodyStrong": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "label": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "caption": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            },
            "mono": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/typography"
            }
          },
          "required": [
            "body",
            "caption",
            "heading",
            "label"
          ],
          "additionalProperties": false
        },
        "space": {
          "type": "object",
          "properties": {
            "none": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "xs": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "sm": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "md": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "lg": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "xl": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "2xl": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "3xl": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            }
          },
          "required": [
            "lg",
            "md",
            "none",
            "sm",
            "xl",
            "xs"
          ],
          "additionalProperties": false
        },
        "radius": {
          "type": "object",
          "properties": {
            "none": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "control": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "card": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "pill": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            },
            "full": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
            }
          },
          "required": [
            "card",
            "control",
            "none"
          ],
          "additionalProperties": false
        },
        "border": {
          "type": "object",
          "properties": {
            "width": {
              "type": "object",
              "properties": {
                "hairline": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                },
                "thin": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                },
                "thick": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                }
              },
              "required": [
                "hairline",
                "thin"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "width"
          ],
          "additionalProperties": false
        },
        "opacity": {
          "type": "object",
          "properties": {
            "disabled": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/number"
            },
            "muted": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/number"
            },
            "scrim": {
              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/number"
            }
          },
          "required": [
            "disabled"
          ],
          "additionalProperties": false
        },
        "motion": {
          "type": "object",
          "properties": {
            "duration": {
              "type": "object",
              "properties": {
                "short": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/duration"
                },
                "base": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/duration"
                },
                "long": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/duration"
                },
                "reduced": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/duration"
                }
              },
              "required": [
                "base",
                "reduced",
                "short"
              ],
              "additionalProperties": false
            },
            "easing": {
              "type": "object",
              "properties": {
                "standard": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/cubicBezier"
                },
                "emphasized": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/cubicBezier"
                },
                "reduced": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/cubicBezier"
                }
              },
              "required": [
                "standard"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "duration",
            "easing"
          ],
          "additionalProperties": false
        },
        "size": {
          "type": "object",
          "properties": {
            "control": {
              "type": "object",
              "properties": {
                "sm": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                },
                "md": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                },
                "lg": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                }
              },
              "required": [
                "md"
              ],
              "additionalProperties": false
            },
            "touchTarget": {
              "type": "object",
              "properties": {
                "min": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                }
              },
              "required": [
                "min"
              ],
              "additionalProperties": false
            },
            "icon": {
              "type": "object",
              "properties": {
                "md": {
                  "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/dimension"
                }
              },
              "required": [
                "md"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "control",
            "icon",
            "touchTarget"
          ],
          "additionalProperties": false
        },
        "button": {
          "$ref": "https://polymorph.dev/schema/components.schema.json#/$defs/button"
        },
        "input": {
          "$ref": "https://polymorph.dev/schema/components.schema.json#/$defs/input"
        },
        "card": {
          "$ref": "https://polymorph.dev/schema/components.schema.json#/$defs/card"
        },
        "stepIndicator": {
          "$ref": "https://polymorph.dev/schema/components.schema.json#/$defs/stepIndicator"
        },
        "disclosure": {
          "$ref": "https://polymorph.dev/schema/components.schema.json#/$defs/disclosure"
        },
        "modes": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "light"
          ],
          "properties": {
            "light": {
              "type": "object",
              "properties": {
                "color": {
                  "type": "object",
                  "properties": {
                    "surface": {
                      "type": "object",
                      "properties": {
                        "base": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "raised": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "sunken": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "overlay": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "inverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "base",
                        "raised"
                      ],
                      "additionalProperties": false
                    },
                    "text": {
                      "type": "object",
                      "properties": {
                        "body": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "muted": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onAction": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onInverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "link": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "disabled": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "body",
                        "disabled",
                        "link",
                        "muted",
                        "onAction"
                      ],
                      "additionalProperties": false
                    },
                    "action": {
                      "type": "object",
                      "properties": {
                        "primary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "hover": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "disabled": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "disabled",
                            "pressed",
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "secondary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "danger": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        }
                      },
                      "required": [
                        "danger",
                        "primary",
                        "secondary"
                      ],
                      "additionalProperties": false
                    },
                    "feedback": {
                      "type": "object",
                      "properties": {
                        "success": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "warning": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "error": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "info": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "error",
                        "success",
                        "warning"
                      ],
                      "additionalProperties": false
                    },
                    "border": {
                      "type": "object",
                      "properties": {
                        "default": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "strong": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "focus": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "default",
                        "focus"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "action",
                    "border",
                    "feedback",
                    "surface",
                    "text"
                  ],
                  "additionalProperties": false
                },
                "elevation": {
                  "type": "object",
                  "properties": {
                    "flat": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "raised": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "overlay": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    }
                  },
                  "required": [
                    "flat",
                    "raised"
                  ],
                  "additionalProperties": false
                }
              },
              "required": [
                "color",
                "elevation"
              ],
              "additionalProperties": false
            },
            "dark": {
              "type": "object",
              "properties": {
                "color": {
                  "type": "object",
                  "properties": {
                    "surface": {
                      "type": "object",
                      "properties": {
                        "base": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "raised": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "sunken": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "overlay": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "inverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "base",
                        "raised"
                      ],
                      "additionalProperties": false
                    },
                    "text": {
                      "type": "object",
                      "properties": {
                        "body": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "muted": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onAction": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onInverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "link": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "disabled": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "body",
                        "disabled",
                        "link",
                        "muted",
                        "onAction"
                      ],
                      "additionalProperties": false
                    },
                    "action": {
                      "type": "object",
                      "properties": {
                        "primary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "hover": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "disabled": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "disabled",
                            "pressed",
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "secondary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "danger": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        }
                      },
                      "required": [
                        "danger",
                        "primary",
                        "secondary"
                      ],
                      "additionalProperties": false
                    },
                    "feedback": {
                      "type": "object",
                      "properties": {
                        "success": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "warning": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "error": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "info": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "error",
                        "success",
                        "warning"
                      ],
                      "additionalProperties": false
                    },
                    "border": {
                      "type": "object",
                      "properties": {
                        "default": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "strong": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "focus": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "default",
                        "focus"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "action",
                    "border",
                    "feedback",
                    "surface",
                    "text"
                  ],
                  "additionalProperties": false
                },
                "elevation": {
                  "type": "object",
                  "properties": {
                    "flat": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "raised": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "overlay": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    }
                  },
                  "required": [
                    "flat",
                    "raised"
                  ],
                  "additionalProperties": false
                }
              },
              "required": [
                "color",
                "elevation"
              ],
              "additionalProperties": false
            },
            "highContrast": {
              "type": "object",
              "properties": {
                "color": {
                  "type": "object",
                  "properties": {
                    "surface": {
                      "type": "object",
                      "properties": {
                        "base": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "raised": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "sunken": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "overlay": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "inverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "base",
                        "raised"
                      ],
                      "additionalProperties": false
                    },
                    "text": {
                      "type": "object",
                      "properties": {
                        "body": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "muted": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onAction": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "onInverse": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "link": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "disabled": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "body",
                        "disabled",
                        "link",
                        "muted",
                        "onAction"
                      ],
                      "additionalProperties": false
                    },
                    "action": {
                      "type": "object",
                      "properties": {
                        "primary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "hover": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "disabled": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "disabled",
                            "pressed",
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "secondary": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        },
                        "danger": {
                          "type": "object",
                          "properties": {
                            "rest": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            },
                            "pressed": {
                              "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                            }
                          },
                          "required": [
                            "rest"
                          ],
                          "additionalProperties": false
                        }
                      },
                      "required": [
                        "danger",
                        "primary",
                        "secondary"
                      ],
                      "additionalProperties": false
                    },
                    "feedback": {
                      "type": "object",
                      "properties": {
                        "success": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "warning": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "error": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "info": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "error",
                        "success",
                        "warning"
                      ],
                      "additionalProperties": false
                    },
                    "border": {
                      "type": "object",
                      "properties": {
                        "default": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "subtle": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "strong": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        },
                        "focus": {
                          "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/color"
                        }
                      },
                      "required": [
                        "default",
                        "focus"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "action",
                    "border",
                    "feedback",
                    "surface",
                    "text"
                  ],
                  "additionalProperties": false
                },
                "elevation": {
                  "type": "object",
                  "properties": {
                    "flat": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "raised": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    },
                    "overlay": {
                      "$ref": "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/shadow"
                    }
                  },
                  "required": [
                    "flat",
                    "raised"
                  ],
                  "additionalProperties": false
                }
              },
              "required": [
                "color",
                "elevation"
              ],
              "additionalProperties": false
            }
          }
        }
      }
    }
  },
  "additionalProperties": true
};
