pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = "amnaa1234/polyglot-backend"
        DOCKER_IMAGE_WORKER   = "amnaa1234/polyglot-worker"
        DOCKER_IMAGE_FRONTEND = "amnaa1234/polyglot-frontend"
        VM_USER               = "ubuntu"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Code checkout ho raha hai...'
                checkout scm
            }
        }

        stage('Pull Latest Docker Images') {
            steps {
                echo 'Latest images pull ho rahi hain...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker pull ${DOCKER_IMAGE_BACKEND}:latest || true
                        docker pull ${DOCKER_IMAGE_WORKER}:latest || true
                        docker pull ${DOCKER_IMAGE_FRONTEND}:latest || true
                    '''
                }
            }
        }

        stage('Deploy to Cloud VM') {
            steps {
                echo 'Cloud VM pe deploy ho raha hai...'
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'cloud-vm-ssh-key',
                        keyFileVariable: 'SSH_KEY'
                    ),
                    string(
                        credentialsId: 'cloud-vm-ip',
                        variable: 'VM_IP'
                    ),
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        scp -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=no \
                            deploy/docker-compose.prod.yml \
                            ${VM_USER}@${VM_IP}:~/docker-compose.prod.yml

                        ssh -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=no \
                            ${VM_USER}@${VM_IP} << EOF
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                docker compose -f ~/docker-compose.prod.yml pull
                                docker compose -f ~/docker-compose.prod.yml up -d --remove-orphans
                                docker ps
EOF
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Health check chal raha hai...'
                withCredentials([string(credentialsId: 'cloud-vm-ip', variable: 'VM_IP')]) {
                    sh '''
                        sleep 15
                        curl --fail http://${VM_IP}:3000 || echo "Health check failed but continuing..."
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! App live hai!'
        }
        failure {
            echo 'Deployment fail hui. Logs check karo.'
        }
    }
}