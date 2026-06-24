exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const requestBody = JSON.parse(event.body);
    const gasUrl = process.env.GAS_URL_SECRET;

    if (!gasUrl || !gasUrl.includes("http")) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            "La URL de Google Apps Script no está configurada o es inválida en Netlify.",
        }),
      };
    }

    const securePayload = {
      ...requestBody,
      app_secret: process.env.ESQUEMAS_MASTER_SECRET,
    };

    const response = await fetch(gasUrl, {
      method: "POST",
      body: JSON.stringify(securePayload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    // Leemos la respuesta como TEXTO primero (para atrapar la página de error de Google)
    const responseText = await response.text();

    try {
      // Intentamos convertirlo a datos reales
      const data = JSON.parse(responseText);
      return { statusCode: 200, body: JSON.stringify(data) };
    } catch (parseError) {
      // Si Google devuelve HTML o texto basura, atrapamos la evidencia
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Google bloqueó la conexión o la URL es incorrecta.",
          details: responseText.substring(0, 150),
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Fallo interno del servidor Netlify.",
        details: error.message,
      }),
    };
  }
};
