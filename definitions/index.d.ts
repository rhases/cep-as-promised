export declare interface CEP {
    cep: string,
    state: string,
    city: string,
    street: string,
    neighborhood: string
}

export declare function cep(cep: string | number): Promise<CEP>
