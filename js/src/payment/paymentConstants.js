// Global variable of constants used by the payment phase.
var paymentConstants = {
    // Button ids used in the theme. .
    CASH_BUTTON_ID: 'btnTenderCash',
    COUNTER_BUTTON_ID: 'btnTenderCounter',
    COUPON_BUTTON_ID: 'btnTenderCoupon',
    CREDIT_BUTTON_ID: 'btnTenderCredit',

    DEBIT_BUTTON_ID: 'btnTenderDebit',
    DISCOUNT_BUTTON_ID: 'btnTenderDiscount',
    EMPLOYEE_BUTTON_ID: 'btnTenderEmployee',
    LOYALTY_BUTTON_ID: 'btnTenderLoyalty',

    GENERICTENDER1_BUTTON_ID: 'btnTenderGeneric1',
    GENERICTENDER2_BUTTON_ID: 'btnTenderGeneric2',
    GENERICTENDER3_BUTTON_ID: 'btnTenderGeneric3',
    GENERICTENDER4_BUTTON_ID: 'btnTenderGeneric4',
    GENERICTENDER5_BUTTON_ID: 'btnTenderGeneric5',
    GENERICTENDER6_BUTTON_ID: 'btnTenderGeneric6',
    GENERICTENDER7_BUTTON_ID: 'btnTenderGeneric7',
    GENERICTENDER8_BUTTON_ID: 'btnTenderGeneric8',
    GENERICTENDER9_BUTTON_ID: 'btnTenderGeneric9',
    GENERICTENDER10_BUTTON_ID: 'btnTenderGeneric10',
   
	GAINCLININGBALANCETENDER1_BUTTON_ID: "btnTenderGAIncliningBalance1",
	GAINCLININGBALANCETENDER2_BUTTON_ID: "btnTenderGAIncliningBalance2",
	GAINCLININGBALANCETENDER3_BUTTON_ID: "btnTenderGAIncliningBalance3",
	GAINCLININGBALANCETENDER4_BUTTON_ID: "btnTenderGAIncliningBalance4",
	GAINCLININGBALANCETENDER5_BUTTON_ID: "btnTenderGAIncliningBalance5",
	GAINCLININGBALANCETENDER6_BUTTON_ID: "btnTenderGAIncliningBalance6",
	GAINCLININGBALANCETENDER7_BUTTON_ID: "btnTenderGAIncliningBalance7",
	GAINCLININGBALANCETENDER8_BUTTON_ID: "btnTenderGAIncliningBalance8",
	GAINCLININGBALANCETENDER9_BUTTON_ID: "btnTenderGAIncliningBalance9",
	GAINCLININGBALANCETENDER10_BUTTON_ID: "btnTenderGAIncliningBalance10",
   
    // Elements ids in the html files in the theme folder.
    CREDIT_CLIP_ELEMENT_ID: 'paymentclip-credit',
    LOYALTY_CLIP_ELEMENT_ID: 'paymentclip-loyalty',
    EMPLOYEE_CLIP_ELEMENT_ID: 'paymentclip-employee',
    SELECT_CLIP_ELEMENT_ID: 'paymentclip-select',
    GENERIC_CLIP_ELEMENT_ID: 'paymentclip-generic',
	GAINCLININGBALANCE_CLIP_ELEMENT_ID: "paymentclip-gaincliningbalance",
    COUPON_CLIP_ELEMENT_ID: 'paymentclip-coupon',

    // Taken from the Flash. A kind of enum of the possible clips. Used by the
    // payment clip factory.
    CASH_CLIP: 'cash',
    COUNTER_CLIP: 'counter',
    COUPON_CLIP: 'coupon',
    CREDIT_CLIP: 'credit',
    LOYALTY_CLIP: 'loyalty',

	GENERICTENDER1_CLIP: 'generictender1',
    GENERICTENDER2_CLIP: 'generictender2',
    GENERICTENDER3_CLIP: 'generictender3',
    GENERICTENDER4_CLIP: 'generictender4',
    GENERICTENDER5_CLIP: 'generictender5',
    GENERICTENDER6_CLIP: 'generictender6',
    GENERICTENDER7_CLIP: 'generictender7',
    GENERICTENDER8_CLIP: 'generictender8',
    GENERICTENDER9_CLIP: 'generictender9',
    GENERICTENDER10_CLIP: 'generictender10',

	GAINCLININGBALANCETENDER1_CLIP: "gaincliningbalancetender1",
	GAINCLININGBALANCETENDER2_CLIP: "gaincliningbalancetender2",
	GAINCLININGBALANCETENDER3_CLIP: "gaincliningbalancetender3",
	GAINCLININGBALANCETENDER4_CLIP: "gaincliningbalancetender4",
	GAINCLININGBALANCETENDER5_CLIP: "gaincliningbalancetender5",
	GAINCLININGBALANCETENDER6_CLIP: "gaincliningbalancetender6",
	GAINCLININGBALANCETENDER7_CLIP: "gaincliningbalancetender7",
	GAINCLININGBALANCETENDER8_CLIP: "gaincliningbalancetender8",
	GAINCLININGBALANCETENDER9_CLIP: "gaincliningbalancetender9",
	GAINCLININGBALANCETENDER10_CLIP: "gaincliningbalancetender10",

    PREPTIME_CLIP: 'preptime',
    PAGER_CLIP: 'pager',
    PROCESSING_CLIP: 'processing',
    SELECTPAYMENT_CLIP: 'selectpayment',
    
    LOYALTYSELECTBUCKET_CLIP: 'loyaltyselectbucket',
    ROOMCHARGE_CLIP: 'roomcharge',
    SUBMITORDER_CLIP: 'submitorder',

    TAKECASH_CLIP: 'takecash',
    EMPLOYEE_CLIP: 'employee',
    LOYALTYPROMPT_CLIP: 'loyaltyprompt',

    // Payment clip class, all payment clips share this class. Used to hide them all, for example.
    PAYMENT_CLIP_CLASS: 'paymentclip',

    // Payment modes
    PAYMENTMODE_STANDARD: 'standard',
    PAYMENTMODE_NOPAYMENT: 'nopayment',

    // Tenders. Used by the tender factory.
    TENDER_CASH: 'cash',
    TENDER_COUNTER: 'counter',
    TENDER_COUPON:'coupon',
    TENDER_CREDIT: 'credit',
    TENDER_DEBIT: 'debit',
    TENDER_DISCOUNT: 'discount',
    TENDER_EMPLOYEE: 'employee',
    TENDER_LOYALTY: 'loyalty',
    TENDER_ROOMCHARGE: 'roomcharge',
    TENDER_GENERIC1: 'generictender1',
    TENDER_GENERIC2: 'generictender2',
    TENDER_GENERIC3: 'generictender3',
    TENDER_GENERIC4: 'generictender4',
    TENDER_GENERIC5: 'generictender5',
    TENDER_GENERIC6: 'generictender6',
    TENDER_GENERIC7: 'generictender7',
    TENDER_GENERIC8: 'generictender8',
    TENDER_GENERIC9: 'generictender9',
    TENDER_GENERIC10: 'generictender10'

};