import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://bzwlompatmrhioxhnwux.supabase.co'
const bucketUrl = '/storage/v1/object/public/images/'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6d2xvbXBhdG1yaGlveGhud3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjEyODcsImV4cCI6MjA2NzI5NzI4N30.T46nsdtGoVRga4vo5BPRv1uZvNbfEimk_tZWIU63urY"
const supabase = createClient(supabaseUrl, supabaseKey)

export async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, class, name, formula, description')
        return data;
    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
    }
}

export async function getCategories() {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('class, name')
        return data;
    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
    }
}

export async function getProductSpecifications(pid) {
    try {
        const { data, error } = await supabase
            .from('specifications')
            .select()
            .eq('pid', parseInt(pid))
        return data;
    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
    }
}

export function getImageURL(id) {
    return supabaseUrl + bucketUrl + id + '.png';
}