import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// Figma Tokens
import './tokens/figma-tokens.css';
//

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

// Redux
import { Provider } from 'react-redux';
import store from './store/index';
import { AuthProvider } from './context/AuthContext';


import { AppProvider } from './context/AppProvider';



ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
      <Suspense>
        <AuthProvider>
          <AppProvider>
            <Provider store={store}>
              <RouterProvider router={router} />
            </Provider>
          </AppProvider>
        </AuthProvider>
      </Suspense>
  </React.StrictMode>,
);
