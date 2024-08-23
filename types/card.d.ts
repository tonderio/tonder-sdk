export interface ICard {
    fields: ICardSkyflowFields;
    icon?: string;
}

export interface ICardSkyflowFields {
    card_number: string;
    expiration_month: string;
    expiration_year: string;
    skyflow_id: string;
    card_scheme: string;
}

export interface ICustomerCardsResponse {
    user_id: number;
    cards: ICard[];
}

export interface ISaveCardResponse {
    skyflow_id: string;
    user_id: number;
}

export interface ISaveCardSkyflowRequest {
    skyflow_id: string;
}

export interface ISaveCardRequest {
    card_number: string;
    cvv: string;
    expiration_month: string;
    expiration_year: string;
    cardholder_name: string;
}
