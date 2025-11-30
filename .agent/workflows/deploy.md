---
description: Deploy changes to GitHub and Vercel
---

This workflow automates the process of committing changes to GitHub and deploying to Vercel.

1.  **Commit and Push to GitHub**
    
    First, we need to ensure all changes are committed and pushed to the remote repository.
    
    ```bash
    git add .
    git commit -m "Deploying latest changes"
    git push origin main
    ```

2.  **Deploy Backend to Vercel**
    
    Deploy the backend service to Vercel.
    
    ```bash
    cd backend
    vercel --prod --yes
    ```

3.  **Deploy Frontend to Vercel**
    
    Deploy the frontend application to Vercel.
    
    ```bash
    cd frontend
    vercel --prod --yes
    ```

4.  **Verify Deployment**
    
    Check the deployment status.
    
    ```bash
    vercel list
    ```
