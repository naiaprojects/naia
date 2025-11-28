// app/api/packages/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();

    try {
        // Fetch packages
        const { data: packages, error: packagesError } = await supabase
            .from('price_packages')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true });

        if (packagesError) throw packagesError;

        // Fetch features for all packages
        const packageIds = packages.map(pkg => pkg.id);
        const { data: features, error: featuresError } = await supabase
            .from('package_features')
            .select('*')
            .in('package_id', packageIds)
            .order('position', { ascending: true });

        if (featuresError) throw featuresError;

        // Combine packages with their features
        const packagesWithFeatures = packages.map(pkg => ({
            id: pkg.package_id,
            name: pkg.name,
            description: pkg.description,
            price: parseFloat(pkg.price),
            popular: pkg.is_popular,
            special: pkg.is_special,
            features: features
                .filter(f => f.package_id === pkg.id)
                .map(f => f.feature_text)
        }));

        return NextResponse.json(packagesWithFeatures);
    } catch (error) {
        console.error('Error fetching packages:', error);
        return NextResponse.json([], { status: 500 });
    }
}