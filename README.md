# prisma-kubernetes
Prisma Kubernetes setup using GKE and Google managed Postgres SQL

# Resources

* [Learning Docker and Kubernetes](https://www.udemy.com/docker-and-kubernetes-the-complete-guide/) - Excellent introduction to Docker and Kubernetes
* [Repo example #1](https://github.com/dpetrick/prisma-k8s-example)
* [Repo example #2](https://github.com/akoenig/prisma-kubernetes-deployment)
* [Article on same type of deployment](https://itnext.io/production-ready-prisma-2da868a407dd)
* [Prisma helm chart](https://github.com/helm/charts/tree/master/stable/prisma)

# Info and disclaimers

* Security - In the k8s folder the prisma-primary-configmap.yaml, prisma-secondary-configmap.yaml and rabbitmq-values.yaml files should NOT be pushed to github. In my own repo these are added to the .gitignore file for both dev and prod cases. When the cluster is setup the files were applied to the GKE cluster manually. These files are not expected to change.
* Prisma deployment - The prisma deployment is exposed as an endpoint in this example. You may not want this and may only want to expose the front facing server.
* K8s folder structure - These folders could be combined and then you could use imperative commands in CircleCI to do the changes in the replica number, limits etc that are different. I decided to keep these separate so that the setup was as declarative as possible at the expense of some duplication.
* Usage - Use this template as a starting point and with caution. This is my first Kubernetes cluster setup and may not follow best practices. This is derived from my own working cluster. Use the repo as a template to aid in making your own setup, not as a boilerplate / foundation.
* Subscriptions - Do not currently work, an issue has been made in the repo, hopefully a Prisma dev can aid in getting this fixed.
* Environment variables - Throughout the k8s folder you will see the format of <VARIABLE_NAME> for all of the variables that would need replacing
* Helm Chart - This would ideally be made into a helm chart. This is a more manual setup than the Prisma helm chart that's been shared in the resources.
* Maintenance - This repo will not be maintained. This repo is just to save developer time who are new to Kubernetes who want to see more examples of a working cluster. It took me a while!
* Feedback - If you have experience in this setup and have some pointers on improvements please leave them as issues with reasoning and I can update the repo to further help the community.

# Cluster setup
This was my list of steps to setup up a cluster created on GKE. You can SSH straight into the cluster from the GKE cluster dashboard by clicking on the terminal icon to then start using kubectl commands.

### 1. Create secrets PRISMA_ENDPOINT, PRISMA_SECRET, APOLLO_ENGINE_KEY, APP_SECRET

kubectl create secret generic <SECRET_NAME> --from-literal <SECRET_KEY>=<SECRET_VALUE>

### 2. Setup docker credentials to let cluster pull down new server images

kubectl create secret docker-registry regcred --docker-server=https://index.docker.io/v1/ --docker-username=<DOCKER_USERNAME> --docker-password=<DOCKER_PASSWORD> --docker-email=<DOCKER_EMAIL>

### 3. Install helm

curl https://raw.githubusercontent.com/helm/helm/master/scripts/get > get_helm.sh

chmod 700 get_helm.sh

./get_helm.sh

### 4. Setup service accounts

kubectl create serviceaccount --namespace kube-system tiller

kubectl create clusterrolebinding tiller-cluster-role --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

### 5. Initiate Helm with the tiller service account

helm init --service-account tiller --upgrade

### 6. Install nginx-ingress with Helm

helm install stable/nginx-ingress --name my-nginx --set rbac.create=true

### 7. Install cert-manager with Helm

helm install \
    --name cert-manager \
    --namespace kube-system \
    stable/cert-manager

### 8. Add in rabbitmq-values.yaml file manually and then install rabbitmq with Helm

echo ‘<BASE64_RABBITMQ_VALUES>’ | base64 --decode > rabbitmq-values.yaml

helm install --name rabbit-cluster -f rabbitmq-values.yaml stable/rabbitmq

### 9. Add Postgres SQL instance and user credentials

kubectl create secret generic cloudsql-instance-credentials \
	--from-file=credentials.json=<PROXY_KEY_FILE_PATH>

kubectl create secret generic cloudsql-db-credentials \
    --from-literal=username=<POSTGRS_USERNAME> --from-literal=password=<POSTGRES_PASSWORD>

### 10. Add and apply the prisma-primary-configmap.yaml and prisma-secondary-configmap.yaml files manually

From here you can look run kubectl get pods and look at the logs to restart any pods that need to be and then deploy prisma to the cluster. When looking at prisma pod logs you will need to append the container name you assigned such as 'kubectl logs <POD_ID> prisma-primary'. This is because the prisma deployment has the cloudsql_proxy sidecar container so you need to specify which image you want to see the logs of.
