import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import ShaderDestination from "./ShaderDestination.js";
import ShaderProgram from "./ShaderProgram.js";
import ShaderSource from "./ShaderSource.js";
import ShaderStruct from "./ShaderStruct.js";
import ShaderFunction from "./ShaderFunction.js";
import addAllToArray from "../Core/addAllToArray.js";

/**
 * An object that makes it easier to build the text of a {@link ShaderProgram}. This tracks GLSL code for both the vertex shader and the fragment shader.
 * <p>
 * For vertex shaders, the shader builder tracks a list of <code>#defines</code>,
 * a list of attributes, a list of uniforms, and a list of shader lines. It also
 * tracks the location of each attribute so the caller can easily build the {@link VertexArray}
 * </p>
 * <p>
 * For fragment shaders, the shader builder tracks a list of <code>#defines</code>,
 * a list of attributes, a list of uniforms, and a list of shader lines.
 * </p>
 *
 * @alias ShaderBuilder
 * @constructor
 *
 * @example
 * const shaderBuilder = new ShaderBuilder();
 * shaderBuilder.addDefine("SOLID_COLOR", undefined, ShaderDestination.FRAGMENT);
 * shaderBuilder.addUniform("vec3", "u_color", ShaderDestination.FRAGMENT);
 * shaderBuilder.addVarying("vec3", v_color");
 * // These locations can be used when creating the VertexArray
 * const positionLocation = shaderBuilder.addPositionAttribute("vec3", "a_position");
 * const colorLocation = shaderBuilder.addAttribute("vec3", "a_color");
 * shaderBuilder.addVertexLines([
 *  "void main()",
 *  "{",
 *  "    v_color = a_color;",
 *  "    gl_Position = vec4(a_position, 1.0);",
 *  "}"
 * ]);
 * shaderBuilder.addFragmentLines([
 *  "void main()",
 *  "{",
 *  "    #ifdef SOLID_COLOR",
 *  "    out_FragColor = vec4(u_color, 1.0);",
 *  "    #else",
 *  "    out_FragColor = vec4(v_color, 1.0);",
 *  "    #endif",
 *  "}"
 * ]);
 * const shaderProgram = shaderBuilder.build(context);
 *
 * @private
 */
function ShaderBuilder() {
  // Some WebGL implementations require attribute 0 to always
  // be active, so the position attribute is tracked separately
  this._positionAttributeLine = undefined;
  this._nextAttributeLocation = 1;
  this._attributeLocations = {};
  this._attributeLines = [];

  // Dynamically-generated structs and functions
  // these are dictionaries of id -> ShaderStruct or ShaderFunction respectively
  this._structs = {};
  this._functions = {};

  this._vertexShaderParts = {
    defineLines: [],
    uniformLines: [],
    shaderLines: [],
    varyingLines: [],
    // identifiers of structs/functions to include, listed in insertion order
    structIds: [],
    functionIds: [],
  };
  this._fragmentShaderParts = {
    defineLines: [],
    uniformLines: [],
    shaderLines: [],
    varyingLines: [],
    // identifiers of structs/functions to include, listed in insertion order
    structIds: [],
    functionIds: [],
  };
}

Object.defineProperties(ShaderBuilder.prototype, {
  /**
   * Get a dictionary of attribute names to the integer location in
   * the vertex shader.
   *
   * @memberof ShaderBuilder.prototype
   * @type {Object<string, number>}
   * @readonly
   * @private
   */
  attributeLocations: {
    get: function () {
      return this._attributeLocations;
    },
  },
});

/**
 * Add a <code>#define</code> macro to one or both of the shaders. These lines
 * will appear at the top of the final shader source.
 *
 * @param {string} identifier An identifier for the macro. Identifiers must use uppercase letters with underscores to be consistent with Cesium's style guide.
 * @param {string} [value] The value of the macro. If undefined, the define will not include a value. The value will be converted to GLSL code via <code>toString()</code>
 * @param {ShaderDestination} [destination=ShaderDestination.BOTH] Whether the define appears in the vertex shader, the fragment shader, or both.
 *
 * @example
 * // creates the line "#define ENABLE_LIGHTING" in both shaders
 * shaderBuilder.addDefine("ENABLE_LIGHTING");
 * // creates the line "#define PI 3.141592" in the fragment shader
 * shaderBuilder.addDefine("PI", 3.141593, ShaderDestination.FRAGMENT);
 */
ShaderBuilder.prototype.addDefine = function (identifier, value, destination) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("identifier", identifier);
  //>>includeEnd('debug');

  destination = destination ?? ShaderDestination.BOTH;

  // The ShaderSource created in build() will add the #define part
  let line = identifier;
  if (defined(value)) {
    line += ` ${value.toString()}`;
  }

  if (ShaderDestination.includesVertexShader(destination)) {
    this._vertexShaderParts.defineLines.push(line);
  }

  if (ShaderDestination.includesFragmentShader(destination)) {
    this._fragmentShaderParts.defineLines.push(line);
  }
};

/**
 * Add a new dynamically-generated struct to the shader
 * @param {string} structId A unique ID to identify this struct in {@link ShaderBuilder#addStructField}
 * @param {string} structName The name of the struct as it will appear in the shader.
 * @param {ShaderDestination} destination Whether the struct will appear in the vertex shader, the fragment shader, or both.
 *
 * @example
 * // generates the following struct in the fragment shader
 * // struct TestStruct
 * // {
 * // };
 * shaderBuilder.addStruct("testStructId", "TestStruct", ShaderDestination.FRAGMENT);
 */
ShaderBuilder.prototype.addStruct = function (
  structId,
  structName,
  destination,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("structId", structId);
  Check.typeOf.string("structName", structName);
  Check.typeOf.number("destination", destination);
  //>>includeEnd('debug');
  this._structs[structId] = new ShaderStruct(structName);
  if (ShaderDestination.includesVertexShader(destination)) {
    this._vertexShaderParts.structIds.push(structId);
  }

  if (ShaderDestination.includesFragmentShader(destination)) {
    this._fragmentShaderParts.structIds.push(structId);
  }
};

/**
 * Add a field to a dynamically-generated struct.
 * @param {string} structId The ID of the struct. This must be created first with {@link ShaderBuilder#addStruct}
 * @param {string} type The GLSL type of the field
 * @param {string} identifier The identifier of the field.
 *
 * @example
 * // generates the following struct in the fragment shader
 * // struct TestStruct
 * // {
 * //    float minimum;
 * //    float maximum;
 * // };
 * shaderBuilder.addStruct("testStructId", "TestStruct", ShaderDestination.FRAGMENT);
 * shaderBuilder.addStructField("testStructId", "float", "maximum");
 * shaderBuilder.addStructField("testStructId", "float", "minimum");
 */
ShaderBuilder.prototype.addStructField = function (structId, type, identifier) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("structId", structId);
  Check.typeOf.string("type", type);
  Check.typeOf.string("identifier", identifier);
  //>>includeEnd('debug');
  this._structs[structId].addField(type, identifier);
};

/**
 * Add a new dynamically-generated function to the shader.
 * @param {string} functionName The name of the function. This will be used to identify the function in {@link ShaderBuilder#addFunctionLines}.
 * @param {string} signature The full signature of the function as it will appear in the shader. Do not include the curly braces.
 * @param {ShaderDestination} destination Whether the struct will appear in the vertex shader, the fragment shader, or both.
 * @example
 * // generates the following function in the vertex shader
 * // vec3 testFunction(float parameter)
 * // {
 * // }
 * shaderBuilder.addStruct("testFunction", "vec3 testFunction(float parameter)", ShaderDestination.VERTEX);
 */
ShaderBuilder.prototype.addFunction = function (
  functionName,
  signature,
  destination,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("functionName", functionName);
  Check.typeOf.string("signature", signature);
  Check.typeOf.number("destination", destination);
  //>>includeEnd('debug');
  this._functions[functionName] = new ShaderFunction(signature);

  if (ShaderDestination.includesVertexShader(destination)) {
    this._vertexShaderParts.functionIds.push(functionName);
  }

  if (ShaderDestination.includesFragmentShader(destination)) {
    this._fragmentShaderParts.functionIds.push(functionName);
  }
};

/**
 * Add lines to a dynamically-generated function
 * @param {string} functionName The name of the function. This must be created beforehand using {@link ShaderBuilder#addFunction}
 * @param {string|string[]} lines One or more lines of GLSL code to add to the function body. Do not include any preceding or ending whitespace, but do include the semicolon for each line.
 *
 * @example
 * // generates the following function in the vertex shader
 * // vec3 testFunction(float parameter)
 * // {
 * //   float signed = 2.0 * parameter - 1.0;
 * //   return vec3(signed, 0.0, 0.0);
 * // }
 * shaderBuilder.addStruct("testFunction", "vec3 testFunction(float parameter)", ShaderDestination.VERTEX);
 * shaderBuilder.addFunctionLines("testFunction", [
 *   "float signed = 2.0 * parameter - 1.0;",
 *   "return vec3(parameter);"
 * ]);
 */
ShaderBuilder.prototype.addFunctionLines = function (functionName, lines) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("functionName", functionName);
  if (typeof lines !== "string" && !Array.isArray(lines)) {
    throw new DeveloperError(
      `Expected lines to be a string or an array of strings, actual value was ${lines}`,
    );
  }
  //>>includeEnd('debug');
  this._functions[functionName].addLines(lines);
};

/**
 * Add a uniform declaration to one or both of the shaders. These lines
 * will appear grouped near the top of the final shader source.
 *
 * @param {string} type The GLSL type of the uniform.
 * @param {string} identifier An identifier for the uniform. Identifiers must begin with <code>u_</code> to be consistent with Cesium's style guide.
 * @param {ShaderDestination} [destination=ShaderDestination.BOTH] Whether the uniform appears in the vertex shader, the fragment shader, or both.
 *
 * @example
 * // creates the line "uniform vec3 u_resolution;"
 * shaderBuilder.addUniform("vec3", "u_resolution", ShaderDestination.FRAGMENT);
 * // creates the line "uniform float u_time;" in both shaders
 * shaderBuilder.addUniform("float", "u_time", ShaderDestination.BOTH);
 */
ShaderBuilder.prototype.addUniform = function (type, identifier, destination) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  Check.typeOf.string("identifier", identifier);
  //>>includeEnd('debug');

  destination = destination ?? ShaderDestination.BOTH;
  const line = `uniform ${type} ${identifier};`;

  if (ShaderDestination.includesVertexShader(destination)) {
    this._vertexShaderParts.uniformLines.push(line);
  }

  if (ShaderDestination.includesFragmentShader(destination)) {
    this._fragmentShaderParts.uniformLines.push(line);
  }
};

/**
 * Add a position attribute declaration to the vertex shader. These lines
 * will appear grouped near the top of the final shader source.
 * <p>
 * Some WebGL implementations require attribute 0 to be enabled, so this is
 * reserved for the position attribute. For all other attributes, see
 * {@link ShaderBuilder#addAttribute}
 * </p>
 *
 * @param {string} type The GLSL type of the attribute
 * @param {string} identifier An identifier for the attribute. Identifiers must begin with <code>a_</code> to be consistent with Cesium's style guide.
 * @return {number} The integer location of the attribute. This location can be used when creating attributes for a {@link VertexArray}. This will always be 0.
 *
 * @example
 * // creates the line "in vec3 a_position;"
 * shaderBuilder.setPositionAttribute("vec3", "a_position");
 */
ShaderBuilder.prototype.setPositionAttribute = function (type, identifier) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  Check.typeOf.string("identifier", identifier);

  if (defined(this._positionAttributeLine)) {
    throw new DeveloperError(
      "setPositionAttribute() must be called exactly once for the attribute used for gl_Position. For other attributes, use addAttribute()",
    );
  }
  //>>includeEnd('debug');

  this._positionAttributeLine = `in ${type} ${identifier};`;

  // Some WebGL implementations require attribute 0 to always be active, so
  // this builder assumes the position will always go in location 0
  this._attributeLocations[identifier] = 0;
  return 0;
};

/**
 * Add an attribute declaration to the vertex shader. These lines
 * will appear grouped near the top of the final shader source.
 * <p>
 * Some WebGL implementations require attribute 0 to be enabled, so this is
 * reserved for the position attribute. See {@link ShaderBuilder#setPositionAttribute}
 * </p>
 *
 * @param {string} type The GLSL type of the attribute
 * @param {string} identifier An identifier for the attribute. Identifiers must begin with <code>a_</code> to be consistent with Cesium's style guide.
 * @return {number} The integer location of the attribute. This location can be used when creating attributes for a {@link VertexArray}
 *
 * @example
 * // creates the line "in vec2 a_texCoord0;" in the vertex shader
 * shaderBuilder.addAttribute("vec2", "a_texCoord0");
 */
ShaderBuilder.prototype.addAttribute = function (type, identifier) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  Check.typeOf.string("identifier", identifier);
  //>>includeEnd('debug');

  const line = `in ${type} ${identifier};`;
  this._attributeLines.push(line);

  const location = this._nextAttributeLocation;
  this._attributeLocations[identifier] = location;

  // Most attributes only require a single attribute location, but matrices
  // require more.
  this._nextAttributeLocation += getAttributeLocationCount(type);
  return location;
};

/**
 * Add a varying declaration to both the vertex and fragment shaders.
 *
 * @param {string} type The GLSL type of the varying
 * @param {string} identifier An identifier for the varying. Identifiers must begin with <code>v_</code> to be consistent with Cesium's style guide.
 * @param {string} [qualifier] A qualifier for the varying, such as <code>flat</code>.
 *
 * @example
 * // creates the line "in vec3 v_color;" in the vertex shader
 * // creates the line "out vec3 v_color;" in the fragment shader
 * shaderBuilder.addVarying("vec3", "v_color");
 */
ShaderBuilder.prototype.addVarying = function (type, identifier, qualifier) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  Check.typeOf.string("identifier", identifier);
  //>>includeEnd('debug');

  qualifier = defined(qualifier) ? `${qualifier} ` : "";

  const line = `${type} ${identifier};`;
  this._vertexShaderParts.varyingLines.push(`${qualifier}out ${line}`);
  this._fragmentShaderParts.varyingLines.push(`${qualifier}in ${line}`);
};

/**
 * Appends lines of GLSL code to the vertex shader
 *
 * @param {string|string[]} lines One or more lines to add to the end of the vertex shader source
 *
 * @example
 * shaderBuilder.addVertexLines([
 *  "void main()",
 *  "{",
 *  "    v_color = a_color;",
 *  "    gl_Position = vec4(a_position, 1.0);",
 *  "}"
 * ]);
 */
ShaderBuilder.prototype.addVertexLines = function (lines) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof lines !== "string" && !Array.isArray(lines)) {
    throw new DeveloperError(
      `Expected lines to be a string or an array of strings, actual value was ${lines}`,
    );
  }
  //>>includeEnd('debug');

  const vertexLines = this._vertexShaderParts.shaderLines;
  if (Array.isArray(lines)) {
    addAllToArray(vertexLines, lines);
  } else {
    // Single string case
    vertexLines.push(lines);
  }
};

/**
 * Appends lines of GLSL code to the fragment shader
 *
 * @param {string[]} lines The lines to add to the end of the fragment shader source
 *
 * @example
 * shaderBuilder.addFragmentLines([
 *  "void main()",
 *  "{",
 *  "    #ifdef SOLID_COLOR",
 *  "    out_FragColor = vec4(u_color, 1.0);",
 *  "    #else",
 *  "    out_FragColor = vec4(v_color, 1.0);",
 *  "    #endif",
 *  "}"
 * ]);
 */
ShaderBuilder.prototype.addFragmentLines = function (lines) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof lines !== "string" && !Array.isArray(lines)) {
    throw new DeveloperError(
      `Expected lines to be a string or an array of strings, actual value was ${lines}`,
    );
  }
  //>>includeEnd('debug');

  const fragmentLines = this._fragmentShaderParts.shaderLines;
  if (Array.isArray(lines)) {
    addAllToArray(fragmentLines, lines);
  } else {
    // Single string case
    fragmentLines.push(lines);
  }
};

/**
 * Builds the {@link ShaderProgram} from the pieces added by the other methods.
 * Call this one time at the end of modifying the shader through the other
 * methods in this class.
 *
 * @param {Context} context The context to use for creating the shader.
 * @return {ShaderProgram} A shader program to use for rendering.
 *
 * @example
 * const shaderProgram = shaderBuilder.buildShaderProgram(context);
 */
ShaderBuilder.prototype.buildShaderProgram = function (context) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("context", context);
  //>>includeEnd('debug');

  const positionAttribute = defined(this._positionAttributeLine)
    ? [this._positionAttributeLine]
    : [];

  const structLines = generateStructLines(this);
  const functionLines = generateFunctionLines(this);

  // Lines are joined here so the ShaderSource
  // generates a single #line 0 directive
  const vertexLines = positionAttribute
    .concat(
      this._attributeLines,
      this._vertexShaderParts.uniformLines,
      this._vertexShaderParts.varyingLines,
      structLines.vertexLines,
      functionLines.vertexLines,
      this._vertexShaderParts.shaderLines,
    )
    .join("\n");
  const vertexShaderSource = new ShaderSource({
    defines: this._vertexShaderParts.defineLines,
    sources: [vertexLines],
  });

  const fragmentLines = this._fragmentShaderParts.uniformLines
    .concat(
      this._fragmentShaderParts.varyingLines,
      structLines.fragmentLines,
      functionLines.fragmentLines,
      this._fragmentShaderParts.shaderLines,
    )
    .join("\n");
  const fragmentShaderSource = new ShaderSource({
    defines: this._fragmentShaderParts.defineLines,
    sources: [fragmentLines],
  });

  return ShaderProgram.fromCache({
    context: context,
    vertexShaderSource: vertexShaderSource,
    fragmentShaderSource: fragmentShaderSource,
    attributeLocations: this._attributeLocations,
  });
};

ShaderBuilder.prototype.clone = function () {
  return clone(this, true);
};

function generateStructLines(shaderBuilder) {
  const vertexLines = [];
  const fragmentLines = [];

  let i;
  let structIds = shaderBuilder._vertexShaderParts.structIds;
  let structId;
  let struct;
  let structLines;
  for (i = 0; i < structIds.length; i++) {
    structId = structIds[i];
    struct = shaderBuilder._structs[structId];
    structLines = struct.generateGlslLines();
    addAllToArray(vertexLines, structLines);
  }

  structIds = shaderBuilder._fragmentShaderParts.structIds;
  for (i = 0; i < structIds.length; i++) {
    structId = structIds[i];
    struct = shaderBuilder._structs[structId];
    structLines = struct.generateGlslLines();
    addAllToArray(fragmentLines, structLines);
  }

  return {
    vertexLines: vertexLines,
    fragmentLines: fragmentLines,
  };
}

function getAttributeLocationCount(glslType) {
  switch (glslType) {
    case "mat2":
      return 2;
    case "mat3":
      return 3;
    case "mat4":
      return 4;
    default:
      return 1;
  }
}

function generateFunctionLines(shaderBuilder) {
  const vertexLines = [];
  const fragmentLines = [];

  let i;
  let functionIds = shaderBuilder._vertexShaderParts.functionIds;
  let functionId;
  let func;
  let functionLines;
  for (i = 0; i < functionIds.length; i++) {
    functionId = functionIds[i];
    func = shaderBuilder._functions[functionId];
    functionLines = func.generateGlslLines();
    addAllToArray(vertexLines, functionLines);
  }

  functionIds = shaderBuilder._fragmentShaderParts.functionIds;
  for (i = 0; i < functionIds.length; i++) {
    functionId = functionIds[i];
    func = shaderBuilder._functions[functionId];
    functionLines = func.generateGlslLines();
    addAllToArray(fragmentLines, functionLines);
  }

  return {
    vertexLines: vertexLines,
    fragmentLines: fragmentLines,
  };
}

export default ShaderBuilder;
