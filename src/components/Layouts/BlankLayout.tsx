import { PropsWithChildren } from 'react';
import App from '../../App';

const BlankLayout = ({ children }: PropsWithChildren) => {
    return (
        <App>
            <div className="text-black min-h-screen">{children} </div>
        </App>
    );
};

export default BlankLayout;
