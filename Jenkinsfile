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
                    sh 'docker build -t gradle-build -f Dockerfile.build .'
                    
                    // 임시 컨테이너 생성하여 WAR 파일 추출
                    sh '''
                        # 컨테이너 생성
                        docker create --name temp-gradle-container gradle-build
                        
                        # 빌드 디렉토리 삭제
                        rm -rf build-output
                        mkdir -p build-output
                        
                        # WAR 파일 복사
                        docker cp temp-gradle-container:/app/build/libs/*.war build-output/
                        
                        # 컨테이너 제거
                        docker rm temp-gradle-container
                        docker rmi gradle-build
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
    }

    post {
        always {
            // 빌드 완료 후 정리
            sh 'docker rm temp-gradle-container || true'
            sh 'docker rmi gradle-build || true'
        }
    }
}
