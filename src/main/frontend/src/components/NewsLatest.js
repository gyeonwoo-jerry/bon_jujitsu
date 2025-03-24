// branchList.js
import React from "react";
//import API from "../utils/api";
import '../styles/newsLatest.css';

function NewsLatest() {

    return (
        <section className='news'>
            <div className='inner'>
                <div className='news_title'>
                    <div className='sub_tit'>본주짓수 소식</div>
                    <div className='tit'>BON NEWS</div>
                    </div>
                    <div className='news_content'>
                    <ul className='news_list'>
                        <li className='news_item'>
                        <div className='news_item_title'>
                            <div className='news_item_title_tit'>당산 본관</div>
                            <button className='news_item_title_more'>
                            <img src='/images/icon_click_wt.png' alt='더보기' />
                            </button>
                        </div>
                        <div className='news_item_content'>
                            1. 4월 세미나 (룰/기술)
                            - 4/13(토) 오후 1시부터
                            - 신청자는 댓글로 남겨주세요!
                            - 세미나비 입금 : 국민은행 75260204261007  (이정우)

                            2. 2024년도 1차 승급식
                            - 4/26(금)
                            - 오전부, 오후부 승급식 (오후부는 7시~9시 통합)

                            3. 본주짓수 회장배 대회 사전안내
                            - 6/15(토)
                            - 미리미리 대회 준비합시다!! 지금부터 대회모드 돌입!
                        </div>
                        </li>
                        <li className='news_item'>
                        <div className='news_item_title'>
                            <div className='news_item_title_tit'>당산 본관</div>
                            <button className='news_item_title_more'>
                            <img src='/images/icon_click_wt.png' alt='더보기' />
                            </button>
                        </div>
                        <div className='news_item_content'>
                            1. 4월 세미나 (룰/기술)
                            - 4/13(토) 오후 1시부터
                            - 신청자는 댓글로 남겨주세요!
                            - 세미나비 입금 : 국민은행 75260204261007  (이정우)

                            2. 2024년도 1차 승급식
                            - 4/26(금)
                            - 오전부, 오후부 승급식 (오후부는 7시~9시 통합)

                            3. 본주짓수 회장배 대회 사전안내
                            - 6/15(토)
                            - 미리미리 대회 준비합시다!! 지금부터 대회모드 돌입!
                        </div>
                        </li>
                        <li className='news_item'>
                        <div className='news_item_title'>
                            <div className='news_item_title_tit'>당산 본관</div>
                            <button className='news_item_title_more'>
                            <img src='/images/icon_click_wt.png' alt='더보기' />
                            </button>
                        </div>
                        <div className='news_item_content'>
                            1. 4월 세미나 (룰/기술)
                            - 4/13(토) 오후 1시부터
                            - 신청자는 댓글로 남겨주세요!
                            - 세미나비 입금 : 국민은행 75260204261007  (이정우)

                            2. 2024년도 1차 승급식
                            - 4/26(금)
                            - 오전부, 오후부 승급식 (오후부는 7시~9시 통합)

                            3. 본주짓수 회장배 대회 사전안내
                            - 6/15(토)
                            - 미리미리 대회 준비합시다!! 지금부터 대회모드 돌입!
                        </div>
                        </li>

                    </ul>
                </div>  
            </div>
        </section>
    );
}

export default NewsLatest;