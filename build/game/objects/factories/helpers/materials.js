//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
const materialToAc = (material) => {
    switch (material.toLowerCase()) {
        case 'cloth':
            return 0;
        case 'leather':
            return 1;
        case 'hard leather':
            return 2;
        case 'wood':
            return 2;
        case 'copper':
            return 3;
        case 'iron':
            return 4;
        case 'steel':
            return 8;
    }
    return 0;
};
const materialToDexterityPenalty = (material) => {
    switch (material.toLowerCase()) {
        case 'cloth':
        case 'leather':
            return 0;
        case 'hard leather':
            return 1;
        case 'copper':
            return 3;
        case 'wood':
        case 'iron':
        case 'steel':
            return 4;
    }
    return 0;
};
const materialToDurability = (material) => {
    switch (material.toLowerCase()) {
        case 'cloth':
            return 10;
        case 'leather':
            return 20;
        case 'wood':
        case 'hard leather':
            return 30;
        case 'copper':
            return 40;
        case 'iron':
            return 60;
        case 'steel':
            return 100;
    }
    return 10;
};
export { materialToAc, materialToDexterityPenalty, materialToDurability, };
