export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
        <h1 className="text-2xl font-bold text-gray-900">Política de privacidad</h1>
        <p className="text-sm text-gray-500">Última actualización: septiembre de 2026</p>

        <p>
          Open America Insurance ("nosotros") recolecta y trata datos personales de las personas
          que solicitan información o inician un proceso de afiliación a un plan de salud a través
          de nuestros formularios, correos electrónicos o mensajes de WhatsApp.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Qué datos recolectamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Datos de contacto: nombre, teléfono y correo electrónico.</li>
            <li>Datos de la solicitud: información necesaria para tramitar un plan de salud o subsidio (por ejemplo, ingresos declarados, composición del hogar, aseguradora y plan seleccionado).</li>
            <li>Firma electrónica y metadatos de la firma (fecha, hora, dirección IP) cuando se firma un documento.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Para qué usamos estos datos</h2>
          <p>
            Usamos esta información exclusivamente para tramitar la solicitud del plan de salud,
            generar y enviar el documento de autorización o consentimiento correspondiente, y
            dar seguimiento al proceso con la persona solicitante.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Con quién compartimos estos datos</h2>
          <p>
            Compartimos los datos únicamente con la aseguradora o el Mercado de Salud (Marketplace)
            correspondiente al plan solicitado, en la medida necesaria para procesar la solicitud.
            No vendemos ni compartimos datos personales con terceros para fines de publicidad.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Cómo solicitar la eliminación de tus datos</h2>
          <p>
            Puedes solicitar la corrección o eliminación de tus datos personales escribiendo al
            correo de contacto indicado abajo. Responderemos tu solicitud en un plazo razonable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Contacto</h2>
          <p>
            Para preguntas sobre esta política o sobre tus datos personales, escríbenos a{' '}
            <a href="mailto:soporte@firmahealthcare.com" className="text-blue-600 underline">
              soporte@firmahealthcare.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
