import ethocaLogo from './assets/brand/dispute-alert/ethoca.png';
import verifiLogo from './assets/brand/dispute-alert/verifi.png';
import type { DisputeEventFeeCategory } from './disputeEventFee';

export const disputeAlertLogos = {
    ETHOCA: ethocaLogo,
    RDR: verifiLogo,
};

export const disputeEventFeeBrand = {
    RDR_FEE: { name: 'Verifi RDR', logo: verifiLogo },
    ETHOCA_ALERT_FEE: { name: 'Ethoca', logo: ethocaLogo },
} satisfies Record<DisputeEventFeeCategory, { name: string; logo: string }>;
