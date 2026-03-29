import OrderForm from '../components/OrderForm';
import DailyOrders from '../components/DailyOrders';

export default function OwnerView() {
    return (
        <div className="p-3 lg:p-4 flex flex-col items-center lg:items-start lg:flex-row gap-3 lg:gap-4 w-full h-auto">
            {/* Left Column — Form */}
            <div className="w-full max-w-md lg:w-[380px] xl:w-[420px] shrink-0 sticky top-4 lg:self-start z-30 mx-auto lg:mx-0">
                <OrderForm />
            </div>

            {/* Right Column — Orders */}
            <div className="flex-1 flex flex-col lg:justify-center min-w-0 min-h-0 lg:px-8 w-full mx-auto lg:mx-0">
                <DailyOrders />
            </div>
        </div>
    );
}
