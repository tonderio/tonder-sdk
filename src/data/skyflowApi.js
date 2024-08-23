

export async function getVaultToken (baseUrl, apiKey, signal = null){
    const response = await fetch(`${baseUrl}/api/v1/vault-token/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${apiKey}`,
        },
        signal: signal,
    });

    if (response.ok) {
        const responseBody = await response.json();
        return responseBody.token;
    } else {
        throw new Error('Failed to retrieve bearer token');
    }
}
