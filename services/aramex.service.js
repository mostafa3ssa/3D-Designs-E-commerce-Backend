import { createClientAsync } from 'soap';
import dotenv from 'dotenv';

dotenv.config();

const WSDL_URL = process.env.ARAMEX_WSDL_URL;
const CLIENT_INFO = {
  UserName: process.env.ARAMEX_USER_NAME,
  Password: process.env.ARAMEX_PASSWORD,
  Version: 'v1.0',
  AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
  AccountPin: process.env.ARAMEX_ACCOUNT_PIN,
  AccountEntity: 'EG',
  AccountCountryCode: 'EG',
};

const ORIGIN_ADDRESS = {
  City: process.env.SHIP_FROM_CITY,
  CountryCode: process.env.SHIP_FROM_COUNTRY_CODE,
};

const DEFAULT_DIMENSIONS = {
  Length: process.env.DEFAULT_PACKAGE_L || 20,
  Width: process.env.DEFAULT_PACKAGE_W || 20,
  Height: process.env.DEFAULT_PACKAGE_H || 10,
  Unit: 'cm',
};

export const calculateShippingRate = async (destinationAddress, cart) => {
  if (!WSDL_URL) {
    throw new Error("Aramex WSDL URL is not set in .env");
  }

  const client = await createClientAsync(WSDL_URL);

  const totalWeightInKg = cart.totalWeight / 1000;
  if (totalWeightInKg <= 0) {
    console.warn("[Aramex Service] Total weight is 0, returning default shipping.");
    return 10.00;
  }

  const requestParams = {
    ClientInfo: CLIENT_INFO,
    Transaction: {
      Reference1: 'rate-calc-001'
    },
    OriginAddress: ORIGIN_ADDRESS,
    DestinationAddress: {
      City: destinationAddress.city,
      CountryCode: destinationAddress.country,
    },
    ShipmentDetails: {
      PaymentType: 'P',
      ProductGroup: 'EXP',
      ProductType: 'PDX',
      ActualWeight: { Value: totalWeightInKg, Unit: 'kg' },
      ChargeableWeight: { Value: totalWeightInKg, Unit: 'kg' },
      Dimensions: DEFAULT_DIMENSIONS,
      NumberOfPieces: 1,
    },
  };

  try {
    const result = await client.CalculateRateAsync(requestParams);
    
    const rateDetails = result[0]?.RateDetails?.RateDetail;
    if (!rateDetails || result[0]?.HasErrors) {
      console.error("[Aramex API Error]", result[0]?.Notifications);
      throw new Error('Aramex API returned an error or no rates.');
    }
    
    const shippingAmount = rateDetails.TotalAmount.Value;
    return parseFloat(shippingAmount);

  } catch (error) {
    console.error("[Aramex SOAP Error]", error.message);
    throw new Error('Failed to calculate shipping rates.');
  }
};
