CREATE POLICY "Users can upload evolution photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evolution-photos' AND auth.role() = 'authenticated'
);