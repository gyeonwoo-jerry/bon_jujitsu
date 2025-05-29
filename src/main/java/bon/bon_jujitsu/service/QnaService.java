package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.QnA;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.QnaRequest;
import bon.bon_jujitsu.dto.response.QnAResponse;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.QnARepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class QnaService {

    private final QnARepository qnaRepository;
    private final PostImageService postImageService;
    private final PostImageRepository postImageRepository;

    public void createQna(QnaRequest request, List<MultipartFile> images) {

        QnA qna = QnA.builder()
                .title(request.title())
                .content(request.content())
                .build();

        qnaRepository.save(qna);

        postImageService.uploadImage(qna.getId(), PostType.QNA, images);
    }

    public PageResponse<QnAResponse> getQnas(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<QnA> qnaPage = qnaRepository.findAll(pageRequest);

        Page<QnAResponse> qnaResponses = qnaPage.map(qna -> {
            List<PostImage> images = postImageRepository.findByPostTypeAndPostId(PostType.QNA, qna.getId());
            return QnAResponse.from(qna, images);
        });

        return PageResponse.fromPage(qnaResponses);
    }


}
