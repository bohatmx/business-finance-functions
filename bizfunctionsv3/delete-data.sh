#!/bin/bash
echo
echo
echo ===========================================================================
echo Starting BFN Firestore clean-up
echo Remove all existing Firestore BFN data
echo ===========================================================================
echo 
cd /Users/mac/Documents/GitHub/business-finance-functions/bizfunctionsv3

echo firebase use business-finance-dev
firebase use business-finance-dev

echo firebase firestore:delete /govtEntities -r -y
firebase firestore:delete /govtEntities -r -y

echo firebase firestore:delete /suppliers -r -y
firebase firestore:delete /suppliers -r -y

echo firebase firestore:delete /investors -r -y
firebase firestore:delete /investors -r -y

echo firebase firestore:delete /users -r -y
firebase firestore:delete /users -r -y

echo firebase firestore:delete /wallets -r -y
firebase firestore:delete /wallets -r -y

echo firebase firestore:delete /investorProfiles -r -y
firebase firestore:delete /investorProfiles -r -y

echo firebase firestore:delete /autoTradeStarts -r -y
firebase firestore:delete /autoTradeStarts -r -y

echo firebase firestore:delete /autoTradeOrders -r -y
firebase firestore:delete /autoTradeOrders -r -y

echo firebase firestore:delete /invalidSummaries -r -y
firebase firestore:delete /invalidSummaries -r -y

echo firebase firestore:delete /sectors -r -y
firebase firestore:delete /sectors -r -y

echo firebase firestore:delete /invoiceOffers -r -y
firebase firestore:delete /invoiceOffers -r -y

echo firebase firestore:delete /userDeleteTriggers -r -y
firebase firestore:delete /userDeleteTriggers -r -y


echo ===========================================================================
echo Ending BFN Firestore clean-up
echo ===========================================================================
echo 