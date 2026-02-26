import { useOutletContext } from 'react-router-dom';
import type { Business } from '../../types';
import { ThemeMinimal } from './themes/ThemeMinimal';
import { ThemeEditorial } from './themes/ThemeEditorial';
import { ThemeCommerce } from './themes/ThemeCommerce';
import { ThemeAppetite } from './themes/ThemeAppetite';
import { ThemeLookbook } from './themes/ThemeLookbook';
import { ThemeStreetwear } from './themes/ThemeStreetwear';
import { ThemeCosmetics } from './themes/ThemeCosmetics';
import { ThemeTechSpecs } from './themes/ThemeTechSpecs';
import { ThemeFineDining } from './themes/ThemeFineDining';
import { ThemeCafe } from './themes/ThemeCafe';
import { ThemeGrocery } from './themes/ThemeGrocery';
import { ThemeServiceBooking } from './themes/ThemeServiceBooking';
import { ThemeAgency } from './themes/ThemeAgency';
import { ThemeSaaS } from './themes/ThemeSaaS';
import { ThemeB2BBulk } from './themes/ThemeB2BBulk';
import { ThemeAutoParts } from './themes/ThemeAutoParts';
import { ThemeFurniture } from './themes/ThemeFurniture';
import { ThemeArtisan } from './themes/ThemeArtisan';
import { ThemeOneProduct } from './themes/ThemeOneProduct';
import { ThemeGamerGear } from './themes/ThemeGamerGear';

export function StoreCatalog() {
    const { business } = useOutletContext<{ business: Business }>();
    const theme = business?.settings?.storefront?.theme || 'minimal';

    switch (theme) {
        case 'gamer':
            return <ThemeGamerGear business={business} />;
        case 'oneproduct':
            return <ThemeOneProduct business={business} />;
        case 'artisan':
            return <ThemeArtisan business={business} />;
        case 'furniture':
            return <ThemeFurniture business={business} />;
        case 'autoparts':
            return <ThemeAutoParts business={business} />;
        case 'b2b':
            return <ThemeB2BBulk business={business} />;
        case 'saas':
            return <ThemeSaaS business={business} />;
        case 'agency':
            return <ThemeAgency business={business} />;
        case 'service':
            return <ThemeServiceBooking business={business} />;
        case 'grocery':
            return <ThemeGrocery business={business} />;
        case 'cafe':
            return <ThemeCafe business={business} />;
        case 'finedining':
            return <ThemeFineDining business={business} />;
        case 'tech':
            return <ThemeTechSpecs business={business} />;
        case 'cosmetics':
            return <ThemeCosmetics business={business} />;
        case 'streetwear':
            return <ThemeStreetwear business={business} />;
        case 'lookbook':
            return <ThemeLookbook business={business} />;
        case 'appetite':
            return <ThemeAppetite business={business} />;
        case 'commerce':
            return <ThemeCommerce business={business} />;
        case 'editorial':
            return <ThemeEditorial business={business} />;
        case 'minimal':
        default:
            return <ThemeMinimal business={business} />;
    }
}
