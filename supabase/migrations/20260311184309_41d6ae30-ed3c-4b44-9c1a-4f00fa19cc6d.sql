
DELETE FROM public.transactions 
WHERE credit_card_id = '4fd8a182-ea29-4a41-bd91-e94df3c2af2c' 
AND installment_group_id IS NOT NULL;
