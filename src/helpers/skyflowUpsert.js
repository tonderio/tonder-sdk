import { defaultStyles } from "./styles";

export async function initUpsertSkyflow(
  vaultId,
  vaultUrl,
  baseUrl,
  apiKey,
  signal,
  customStyles = {}
) {
  const skyflow = await Skyflow.init({
    vaultID: vaultId,
    vaultURL: vaultUrl,
    getBearerToken: async () => {
      // Pass the signal to the fetch call
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
    },
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env: Skyflow.Env.DEV,
    },
  });

  const cvvCollectContainer = await skyflow.container(
    Skyflow.ContainerType.COLLECT
  );

  // Custom styles for collect elements.
  var collectStylesOptions = Object.keys(customStyles).length === 0 ? defaultStyles : customStyles

  const cvvElementUpsert = await cvvCollectContainer.create({
    table: "cards",
    column: "cvv",
    ...collectStylesOptions,
    label: 'Upsert CVV',
    placeholder: collectStylesOptions.placeholders?.cvvPlaceholder,
    type: Skyflow.ElementType.CVV,
    skyflowID:  'd8ad3825-848b-4150-b077-c849b14031c8',
  });

  await mountElements(
    cvvElementUpsert,
  )

  return cvvCollectContainer
}

async function mountElements(
  cvvElementUpsert,
) {
  cvvElementUpsert.mount("#collectCvvUpsert");
}
