export interface IPaymentMethodResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ITonderPaymentMethod[];
}

export interface ITonderPaymentMethod {
    pk: string;
    payment_method: string;
    priority: number;
    category: string;
    unavailable_countries: string[];
    status: string;
}

export interface IPaymentMethod {
    id: string;
    payment_method: string;
    priority: number;
    category: string;
    icon: string;
    label: string;
}