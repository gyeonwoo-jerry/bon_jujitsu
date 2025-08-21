pipeline {
    agent any

    environment {
        SPRING_PROFILE = 'prod'  // 여기에 원하는 프로파일을 설정
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build with Docker') {
            steps {
                script {
                    // Dockerfile을 사용하여 빌드 이미지 생성
                    sh 'docker build --build-arg SPRING_PROFILE=${SPRING_PROFILE} -t bon_jujitsu-build-prod -f Dockerfile.build .'
                    
                    // 임시 컨테이너 생성하여 WAR 파일 추출
                    sh '''
                        # 컨테이너 생성
                        docker create --name bon_jujitsu-gradle-container-prod bon_jujitsu-build-prod
                        
                        # 빌드 디렉토리 삭제 및 출력 디렉토리 생성
                        rm -rf build-output || true
                        mkdir -p build-output
                        
                        # WAR 파일이 생성될 정확한 경로를 확인하여 복사
                        docker cp bon_jujitsu-gradle-container-prod:/app/build/libs/bon_jujitsu-0.0.1-SNAPSHOT.war build-output/
                        
                        # WAR 파일이 실제로 존재하는지 확인
                        #docker exec temp-gradle-container ls /app/build/libs/
                        
                        # 컨테이너 제거
                        docker rm bon_jujitsu-gradle-container-prod
                        docker rmi bon_jujitsu-build-prod
                    '''
                }
            }
        }

        stage('Archive WAR') {
            steps {
                // WAR 파일 아카이브
                archiveArtifacts artifacts: 'build-output/*.war', fingerprint: true
            }
        }

        stage('Deploy to Remote Server') {
            steps {
                sshPublisher(
                    publishers: [
                        sshPublisherDesc(
                            configName: 'ezylab_server',  // Jenkins에서 설정한 SSH 서버 이름
                            transfers: [
                                sshTransfer(
                                    sourceFiles: 'build-output/*.war',  // 전송할 파일
                                    remoteDirectory: 'bon/build', // 원격 서버 저장 경로
                                    removePrefix: 'build-output', // 원격 경로에서 'build-output' 제거
                                    execCommand: 'sudo -u tomcat /app/bon/bin/ci_restart.sh' // 배포 후 서비스 재시작 (옵션)
                                )
                            ]
                        )
                    ]
                )
            }
        }
    }

    post {
        success {
            sh 'docker rm bon_jujitsu-gradle-container-prod || true'
            sh 'docker rmi bon_jujitsu-build-prod || true'
        }
        failure {
            echo "Build failed, keeping container for debugging."
        }
    }
}
