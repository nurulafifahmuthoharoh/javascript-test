'use strict';

/** ============================ Beam Analysis Data Type ============================ */

/**
 * Beam material specification.
 *
 * @param {String} name         Material name
 * @param {Object} properties   Material properties {EI : 0, GA : 0, ....}
 */
class Material {
    constructor(name, properties) {
        this.name = name;
        this.properties = properties;
    }
}

/**
 *
 * @param {Number} primarySpan          Beam primary span length
 * @param {Number} secondarySpan        Beam secondary span length
 * @param {Material} material           Beam material object
 */
class Beam {
    constructor(primarySpan, secondarySpan, material) {
        this.primarySpan = primarySpan;
        this.secondarySpan = secondarySpan;
        this.material = material;
    }
}

/** ============================ Beam Analysis Class ============================ */

class BeamAnalysis {
    constructor() {
        this.options = {
            condition: 'simply-supported'
        };

        this.analyzer = {
            'simply-supported': new BeamAnalysis.analyzer.simplySupported(),
            'two-span-unequal': new BeamAnalysis.analyzer.twoSpanUnequal()
        };
    }
    /**
     *
     * @param {Beam} beam
     * @param {Number} load
     */
    getDeflection(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getDeflectionEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
    getBendingMoment(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getBendingMomentEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
    getShearForce(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getShearForceEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
}




/** ============================ Beam Analysis Analyzer ============================ */

/**
 * Available analyzers for different conditions
 */
BeamAnalysis.analyzer = {};

/**
 * Calculate deflection, bending stress and shear stress for a simply supported beam
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.simplySupported = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }

    getDeflectionEquation(beam, load) {
        const L = beam.primarySpan; 
        const EI = beam.material.properties.EI / (1000 ** 3); 
        const j2 = parseFloat(document.getElementById('j2').value); 
        
        return (x) => {
            const deflection = 
                -((load * x) / (24 * EI)) *
                (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3)) *
                j2 * 1000;

            return { x, y: deflection }; 
        };
    }

   
    getBendingMomentEquation(beam, load) {
        const L = beam.primarySpan; 
        return (x) => ({
            x, 
            y: -((load * x / 2) * (L - x)) 
        });
    }


    getShearForceEquation(beam, load) {
        const L = beam.primarySpan; 
        return (x) => ({
            x,
            y: load * ((L / 2) - x), 
        });
    }
};


/**
 * Calculate deflection, bending stress and shear stress for a beam with two spans of equal condition
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.twoSpanUnequal = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }

    calculateReactions(beam, load) {
        const L1 = beam.primarySpan;
        const L2 = beam.secondarySpan;
        const totalLength = L1 + L2;
    
        const M1 = -(load * (L2 ** 3) + load * (L1 ** 3)) / (8 * totalLength);
        const R1 = M1 / L1 + (load * L1) / 2;
        const R3 = M1 / L2 + (load * L2) / 2;
        const R2 = load * (L1 + L2) - R1 - R3;
    
        return { M1, R1, R2, R3 };
    }
    

    getBendingMomentEquation(beam, load) {
        const L1 = beam.primarySpan;
        const L2 = beam.secondarySpan;
        const totalLength = L1 + L2;
    
        const M1 = (load * Math.pow(L2, 3) + load * Math.pow(L1, 3)) / (8 * totalLength); 
        const R1 = -M1 / L1 + (load * L1) / 2; 
        const R3 = -M1 / L2 + (load * L2) / 2; 
        const R2 = load * totalLength - R1 - R3;
    
        return function (x) {
            if (x === 0 || x === totalLength) {
                return { x, y: 0 };
            } else if (x > 0 && x < L1) {
                return { x, y: -1 * (R1 * x - (load * Math.pow(x, 2)) / 2) }; 
            } else if (x === L1) {
                return [
                    { x, y: -1 * (R1 * L1 - (load * Math.pow(L1, 2)) / 2) }, 
                    { x, y: -1 * (R1 * L1 + R2 * (x - L1) - (load * Math.pow(L1, 2)) / 2) },
                ];
            } else if (x > L1 && x < totalLength) {
                return { x, y: -1 * (R1 * x + R2 * (x - L1) - (load * Math.pow(x, 2)) / 2) }; 
            }
        };
    }
    
    getDeflectionEquation(beam, load) {
        const L1 = beam.primarySpan;
        const L2 = beam.secondarySpan;
        const totalLength = L1 + L2;
        const EI = beam.material.properties.EI / Math.pow(1000, 3); 
        const j2 = parseFloat(document.getElementById('j2').value); 

        const M1 = -(load * Math.pow(L2, 3) + load * Math.pow(L1, 3)) / (8 * totalLength);
        const R1 = M1 / L1 + (load * L1) / 2;
        const R3 = M1 / L2 + (load * L2) / 2;
        const R2 = load * totalLength - R1 - R3;
      
        return function (x) {
            let deflection = 0;
          
            if (x >= 0 && x <= L1) {
          
              deflection = (
                (x / (24 * EI)) *
                (4 * R1 * Math.pow(x, 2) -
                  load * Math.pow(x, 3) +
                  load * Math.pow(L1, 3) -
                  4 * R1 * Math.pow(L1, 2))
              ) * (1000 * j2);
            } else if (x > L1 && x <= totalLength) {

              deflection = (
                (
                  (R1 * x / 6) * (Math.pow(x, 2) - Math.pow(L1, 2)) +
                  (R2 * x / 6) * (Math.pow(x, 2) - 3 * L1 * x + 3 * Math.pow(L1, 2)) -
                  (R2 * Math.pow(L1, 3)) / 6 -
                  (load * x / 24) * (Math.pow(x, 3) - Math.pow(L1, 3))
                ) *
                (1 / (EI / Math.pow(1000, 3))) *
                (1000 * j2)
              );
            }
          
            return { x, y: deflection };
          };
          
      }
      
    getShearForceEquation(beam, load) {
        const L1 = beam.primarySpan;
        const L2 = beam.secondarySpan;
        const totalLength = L1 + L2;
    
    
        const M1 = -(load * Math.pow(L2, 3) + load * Math.pow(L1, 3)) / (8 * totalLength);
        const R1 = M1 / L1 + (load * L1) / 2;
        const R3 = M1 / L2 + (load * L2) / 2;
        const R2 = load * totalLength - R1 - R3;
    
        return function (x) {
            if (x === 0) {
                return { x, y: R1 };
            } else if (x > 0 && x < L1) {
                return { x, y: R1 - (load * x) };
            } else if (x === L1) {
                return [
                    { x: L1, y: R1 - (load * L1) },       
                    { x: L1, y: R1 + R2 - (load * L1) }  
                ];
            } else if (x > L1 && x < totalLength) {
                return { x, y: R1 + R2 - (load * x) };
            } else if (x === totalLength) {
                return { x, y: R1 + R2 - (load * totalLength) };
            } else {
                return { x, y: 0 }; 
            }
        };
    }
};
