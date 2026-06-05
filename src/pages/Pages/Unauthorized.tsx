import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-semibold">Sin permiso</h1>
    <p className="max-w-md text-gray-600">
      No tenés acceso a esta sección con tu usuario actual.
    </p>
    <Link to="/" className="btn btn-primary">
      Volver al inicio
    </Link>
  </div>
);

export default Unauthorized;
