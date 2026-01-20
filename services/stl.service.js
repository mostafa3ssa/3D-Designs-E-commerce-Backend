import parse from 'node-stl';
import { PRICE_PER_GRAM, MATERIAL_DENSITY_G_PER_CM3, SETUP_FEE } from '../utils/constants.js';

export const calculateTotalWeight = async (fileBuffers) => {
    let totalVolumeCm3 = 0;
    console.log(`[STL Service] Calculating weight for ${fileBuffers.length} file(s)...`);

    for (const buffer of fileBuffers) {
        try {
            const stlData = new parse(buffer);
            console.log(`[STL Service] Parsed file volume: ${stlData.volume} cm³`);
            totalVolumeCm3 += stlData.volume;
        } catch (error) {
            console.error('[STL Service] Failed to parse STL buffer:', error);
            throw new Error('StlParseError');
        }
    }
    
    const totalWeight = totalVolumeCm3 * MATERIAL_DENSITY_G_PER_CM3;
    console.log(`[STL Service] Total Volume: ${totalVolumeCm3.toFixed(2)} cm³`);
    console.log(`[STL Service] Total Weight: ${totalWeight.toFixed(2)} g`);
    return totalWeight;
};

export const calculatePrice = (weightInGrams, quantity) => {
    console.log(`[STL Service] Calculating price for ${weightInGrams.toFixed(2)}g, quantity ${quantity}`);
    
    const materialCost = weightInGrams * PRICE_PER_GRAM;
    
    const totalJobCost = (materialCost * quantity) + SETUP_FEE;

    console.log(`[STL Service] Material Cost (per item): $${materialCost.toFixed(2)}`);
    console.log(`[STL Service] Setup Fee (one time): $${SETUP_FEE.toFixed(2)}`);
    console.log(`[STL Service] Total Price: $${totalJobCost.toFixed(2)}`);
    
    return totalJobCost;
};

