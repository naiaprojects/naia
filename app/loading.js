import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <LogoPathAnimation />
        </div>
    );
}
