import OrderForm from '../components/OrderForm';
import DailyOrders from '../components/DailyOrders';

export default function OwnerView() {
    return (
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
            <div className="w-full lg:w-[400px] xl:w-[420px] lg:shrink-0 lg:sticky lg:top-[84px]">
                <OrderForm />
            </div>
            <section className="flex-1 min-w-0">
                <DailyOrders />
            </section>
        </div>
    );
}
