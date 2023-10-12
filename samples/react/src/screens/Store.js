import React from 'react'

import ProductCard from '../components/ProductCard'
import { productsArray } from '../storeProducts'

const Store = () => {
    return (
        <>
            {productsArray.map((product, index) => {
                return (
                    <ProductCard
                        key={index}
                        productData={product}
                    />
                )
            })}
        </>
    )
}

export default Store